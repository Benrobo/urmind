interface BaseProps {
  action: "navigation-detected" | "openOptionsPage";
  payload?: Record<string, any>;
}

interface NavigationDetectedMessage extends BaseProps {
  action: "navigation-detected";
  payload: {
    url: string;
  };
}

interface OpenOptionsPageMessage extends BaseProps {
  action: "openOptionsPage";
}

export function sendMessageToBackgroundScript(
  message: NavigationDetectedMessage | OpenOptionsPageMessage
) {
  chrome.runtime.sendMessage(message);
}
