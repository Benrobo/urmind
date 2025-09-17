interface BaseProps {
  action: "navigation-detected" | "openOptionsPage";
  payload?: Record<string, any>;
}

interface NavigationDetectedMessage extends BaseProps {
  action: "navigation-detected";
  payload: {
    url: string;
    pageMetadata: {
      title: string;
      description: Element | null;
      og: {
        image: string | null;
        title: string | null;
      };
      pageContent: string;
      pageUrl: string;
    };
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
