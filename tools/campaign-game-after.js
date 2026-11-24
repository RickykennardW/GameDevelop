if(runtimeScene.__pauseUI?.frameBlocked)return; // Pause preserves the current owner and input state.
// After native damage/death/wave completion and audio; no second gameplay loop.
runtimeScene.__campaignRun?.after();
