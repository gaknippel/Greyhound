#include "stdafx.h"

// The class we are implementing
#include "HeadlessServer.h"

// We need the following classes
#include "CoDAssets.h"
#include "FileSystems.h"
#include "SettingsManager.h"
#include "json.hpp"

using nlohmann::json;

namespace
{
    // Output is written from the export thread too
    std::mutex OutputLock;
    // The export thread, only one export at a time
    std::thread ExportThread;
    std::atomic<bool> Exporting(false);

    void Send(const json& Message)
    {
        // Asset names aren't guaranteed to be valid UTF-8
        auto Line = Message.dump(-1, ' ', false, json::error_handler_t::replace) + "\n";

        std::lock_guard<std::mutex> Lock(OutputLock);
        DWORD Written = 0;
        WriteFile(GetStdHandle(STD_OUTPUT_HANDLE), Line.data(), (DWORD)Line.size(), &Written, NULL);
    }

    const char* StatusName(WraithAssetStatus Status)
    {
        switch (Status)
        {
        case WraithAssetStatus::Loaded: return "loaded";
        case WraithAssetStatus::Exported: return "exported";
        case WraithAssetStatus::NotLoaded: return "not_loaded";
        case WraithAssetStatus::Placeholder: return "placeholder";
        case WraithAssetStatus::Processing: return "processing";
        case WraithAssetStatus::Error: return "error";
        }
        return "unknown";
    }

    json DescribeAsset(const CoDAsset_t* Asset)
    {
        json Result = { { "name", Asset->AssetName }, { "status", StatusName(Asset->AssetStatus) } };

        // Raw numbers only, the UI decides how to present them
        switch (Asset->AssetType)
        {
        case WraithAssetType::Model:
        {
            auto Model = (const CoDModel_t*)Asset;
            Result["type"] = "model";
            Result["bones"] = Model->BoneCount;
            Result["cosmetic_bones"] = Model->CosmeticBoneCount;
            Result["lods"] = Model->LodCount;
            break;
        }
        case WraithAssetType::Animation:
        {
            auto Anim = (const CoDAnim_t*)Asset;
            Result["type"] = "anim";
            Result["framerate"] = Anim->Framerate;
            Result["frames"] = Anim->FrameCount;
            Result["bones"] = Anim->BoneCount;
            break;
        }
        case WraithAssetType::Image:
            Result["type"] = "image";
            Result["width"] = ((const CoDImage_t*)Asset)->Width;
            Result["height"] = ((const CoDImage_t*)Asset)->Height;
            break;
        case WraithAssetType::Sound:
            Result["type"] = "sound";
            Result["length_ms"] = ((const CoDSound_t*)Asset)->Length;
            break;
        case WraithAssetType::Material:
            Result["type"] = "material";
            Result["images"] = ((const CoDMaterial_t*)Asset)->ImageCount;
            break;
        case WraithAssetType::RawFile:
            Result["type"] = "rawfile";
            Result["size"] = Asset->AssetSize;
            break;
        case WraithAssetType::Effect:
            Result["type"] = "effect";
            break;
        default:
            Result["type"] = "unknown";
            break;
        }

        return Result;
    }

    void OnProgress(void* Caller, uint32_t Progress)
    {
        UNREFERENCED_PARAMETER(Caller);
        Send({ { "event", "progress" }, { "value", Progress } });
    }

    void OnStatus(void* Caller, uint32_t AssetIndex)
    {
        UNREFERENCED_PARAMETER(Caller);
        Send({ { "event", "status" }, { "index", AssetIndex }, { "status", StatusName(CoDAssets::GameAssets->LoadedAssets[AssetIndex]->AssetStatus) } });
    }

    void FinishExport()
    {
        if (ExportThread.joinable())
            ExportThread.join();
    }

    json Handle(const json& Request)
    {
        auto Command = Request.value("cmd", "");
        auto HasAssets = CoDAssets::GameAssets != nullptr;

        // These change the asset list the export thread is reading
        if (Exporting && (Command == "load_game" || Command == "clear" || Command == "export"))
            return { { "ok", false }, { "error", "busy exporting" } };

        if (Command == "load_game")
        {
            FinishExport();

            switch (CoDAssets::BeginGameMode())
            {
            case FindGameResult::Success:
                return
                {
                    { "ok", true },
                    { "process", FileSystems::GetFileName(CoDAssets::GameInstance->GetProcessPath()) },
                    { "count", CoDAssets::GameAssets->LoadedAssets.size() }
                };
            case FindGameResult::NoGamesRunning: return { { "ok", false }, { "error", "no_games_running" } };
            case FindGameResult::FailedToLocateInfo: return { { "ok", false }, { "error", "unsupported_game_update" } };
            default: return { { "ok", false }, { "error", "unknown" } };
            }
        }
        if (Command == "assets")
        {
            auto Assets = json::array();
            if (HasAssets)
                for (auto& Asset : CoDAssets::GameAssets->LoadedAssets)
                    Assets.push_back(DescribeAsset(Asset));
            return { { "ok", true }, { "assets", std::move(Assets) } };
        }
        if (Command == "export")
        {
            if (!HasAssets)
                return { { "ok", false }, { "error", "no game loaded" } };

            // Indices come from the UI, check them before the engine indexes with them
            std::vector<uint32_t> Indices;
            auto Count = CoDAssets::GameAssets->LoadedAssets.size();
            for (auto& Index : Request.value("indices", json::array()))
            {
                if (!Index.is_number_unsigned() || Index.get<uint64_t>() >= Count)
                    return { { "ok", false }, { "error", "invalid index" } };
                Indices.push_back(Index.get<uint32_t>());
            }
            if (Indices.empty())
                return { { "ok", false }, { "error", "nothing to export" } };

            FinishExport();
            Exporting = true;
            CoDAssets::OnExportProgress = OnProgress;
            CoDAssets::OnExportStatus = OnStatus;
            ExportThread = std::thread([Indices, Id = Request.value("id", json())]
            {
                CoDAssets::ExportSelection(Indices);
                Exporting = false;
                Send({ { "event", "export_done" }, { "id", Id }, { "cancelled", !CoDAssets::CanExportContinue }, { "path", CoDAssets::GetExportRoot() } });
            });
            return { { "ok", true }, { "count", Indices.size() } };
        }
        if (Command == "cancel")
        {
            CoDAssets::CanExportContinue = false;
            return { { "ok", true } };
        }
        if (Command == "clear")
        {
            FinishExport();
            CoDAssets::CleanUpGame();
            return { { "ok", true } };
        }
        if (Command == "get_settings")
        {
            // The UI asks for the keys it shows, it has to know them to draw the controls anyway
            auto Settings = json::object();
            for (auto& Key : Request.value("keys", json::array()))
                Settings[Key.get<std::string>()] = SettingsManager::GetSetting(Key.get<std::string>());
            return { { "ok", true }, { "settings", std::move(Settings) } };
        }
        if (Command == "export_root")
            return { { "ok", true }, { "path", CoDAssets::GetExportRoot() } };
        if (Command == "set_setting")
        {
            if (!Request.contains("key") || !Request["key"].is_string() || !Request.contains("value") || !Request["value"].is_string())
                return { { "ok", false }, { "error", "key and value must be strings" } };
            SettingsManager::SetSetting(Request["key"].get<std::string>(), Request["value"].get<std::string>());
            SettingsManager::SaveSettings();
            return { { "ok", true } };
        }

        return { { "ok", false }, { "error", "unknown command" } };
    }
}

void HeadlessServer::Run()
{
    Send({ { "event", "ready" } });

    std::string Pending;
    char Buffer[4096];
    DWORD Read = 0;

    // One JSON request per line, until the UI closes our stdin
    while (ReadFile(GetStdHandle(STD_INPUT_HANDLE), Buffer, sizeof(Buffer), &Read, NULL) && Read > 0)
    {
        Pending.append(Buffer, Read);

        size_t LineEnd;
        while ((LineEnd = Pending.find('\n')) != std::string::npos)
        {
            auto Line = Pending.substr(0, LineEnd);
            Pending.erase(0, LineEnd + 1);
            if (!Line.empty() && Line.back() == '\r')
                Line.pop_back();
            if (Line.empty())
                continue;

            auto Request = json::parse(Line, nullptr, false);
            if (!Request.is_object())
            {
                Send({ { "ok", false }, { "error", "invalid json" } });
                continue;
            }

            // Wrong field types from the UI throw inside the json library
            json Response;
            try
            {
                Response = Handle(Request);
            }
            catch (const json::exception& Error)
            {
                Response = { { "ok", false }, { "error", Error.what() } };
            }
            if (Request.contains("id"))
                Response["id"] = Request["id"];
            Send(Response);
        }
    }

    // UI went away, stop any export before the engine is torn down
    CoDAssets::CanExportContinue = false;
    FinishExport();
}
