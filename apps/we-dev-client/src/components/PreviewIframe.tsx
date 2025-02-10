import { useEffect, useState, useRef } from "react";
import { getContainerInstance } from "./WeIde/services";

interface PreviewIframeProps {
  setShowIframe: (show: boolean) => void;
  isMinPrograme: boolean;
}

const PreviewIframe: React.FC<PreviewIframeProps> = ({ setShowIframe, isMinPrograme }) => {
  const [url, setUrl] = useState<string>("");
  const [port, setPort] = useState<string>("");
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [scale, setScale] = useState<number>(1);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    (async () => {
      const instance = await getContainerInstance();
      instance?.on("server-ready", (port, url) => {
        console.log("server-ready", port, url);
        setUrl(url);
        setShowIframe(true);
        setPort(port.toString());
      });
    })();
  }, []);

  const handleRefresh = () => {
    console.log("刷新 handleRefresh", iframeRef.current);
    if (iframeRef.current) {
      iframeRef.current.src = iframeRef.current.src;
    }
  };

  const displayUrl = port ? `http://localhost:${port}` : "暂时没有服务运行";

  const handleWheel = (e: WheelEvent) => {
    if (e.ctrlKey) {
      e.preventDefault();
      const delta = e.deltaY > 0 ? 0.9 : 1.1;
      setScale((prevScale) => {
        const newScale = prevScale * delta;
        return Math.min(Math.max(newScale, 0.5), 3);
      });
    }
  };

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let initialDistance = 0;
    let initialScale = 1;

    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 2) {
        e.preventDefault();
        initialDistance = Math.hypot(
          e.touches[0].clientX - e.touches[1].clientX,
          e.touches[0].clientY - e.touches[1].clientY
        );
        initialScale = scale;
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 2) {
        e.preventDefault();
        const distance = Math.hypot(
          e.touches[0].clientX - e.touches[1].clientX,
          e.touches[0].clientY - e.touches[1].clientY
        );
        const delta = distance / initialDistance;
        const newScale = Math.min(Math.max(initialScale * delta, 0.5), 3);
        setScale(newScale);
      }
    };

    container.addEventListener("wheel", handleWheel, { passive: false });
    container.addEventListener("touchstart", handleTouchStart);
    container.addEventListener("touchmove", handleTouchMove);

    return () => {
      container.removeEventListener("wheel", handleWheel);
      container.removeEventListener("touchstart", handleTouchStart);
      container.removeEventListener("touchmove", handleTouchMove);
    };
  }, [scale]);

  const handleZoomIn = () => {
    setScale((prevScale) => Math.min(prevScale * 1.1, 3));
  };

  const handleZoomOut = () => {
    setScale((prevScale) => Math.max(prevScale * 0.9, 0.5));
  };

  const handleZoomReset = () => {
    setScale(1);
  };

  const openExternal = () => {
      // window.open('http://localhost:5174/');
      // window.open(url, "_blank", "noopener,noreferrer");
      window.electron.ipcRenderer.send("open:external:url", "http://localhost:5174/");
  }

  return (
    <div className="preview-container w-full h-full relative flex flex-col overflow-hidden">
      <div className="browser-header bg-[#252526] border-b border-gray-200 px-4 py-1 flex items-center space-x-2">
        <div className="flex space-x-1.5">
          <div className="w-3 h-3 rounded-full bg-red-500"></div>
          <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
          <div className="w-3 h-3 rounded-full bg-green-500" onClick={openExternal}></div>
        </div>
        <div className="flex-1 ml-4 flex items-center">
          <div className="px-3 py-1 rounded-md text-sm text-gray-50 border bg-[#2c2c2c] border-black w-full truncate">
            {displayUrl}
          </div>
          <button
            onClick={handleRefresh}
            className="ml-2 p-1 rounded hover:bg-[#2c2c2c] text-gray-400 hover:text-gray-200"
            title="刷新"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z"
                clipRule="evenodd"
              />
            </svg>
          </button>
          <div className="ml-2 flex items-center space-x-1">
            <button
              onClick={handleZoomOut}
              className="p-1 rounded hover:bg-[#2c2c2c] text-gray-400 hover:text-gray-200"
              title="缩小"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M5 10a1 1 0 011-1h8a1 1 0 110 2H6a1 1 0 01-1-1z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
            <button
              onClick={handleZoomReset}
              className="px-2 py-0.5 rounded hover:bg-[#2c2c2c] text-gray-400 hover:text-gray-200 text-xs"
              title="重置缩放"
            >
              {Math.round(scale * 100)}%
            </button>
            <button
              onClick={handleZoomIn}
              className="p-1 rounded hover:bg-[#2c2c2c] text-gray-400 hover:text-gray-200"
              title="放大"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>

      <div
        ref={containerRef}
        className="flex-1 relative bg-white overflow-hidden rounded-b-lg "
        style={{
          cursor: isDragging ? "grabbing" : "grab",
        }}
      >
        <iframe
          ref={iframeRef}
          src={url}
          className="w-full h-full border-none rounded-b-lg bg-white origin-center overflow-hidden"
          style={{
            minHeight: "400px",
            transition: "transform 0.1s ease",
            transform: `scale(${scale})`,
            width: `100%`,
            height: `100%`,
          }}
          title="preview"
          sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
          allow="cross-origin-isolated"
        />
        {!url && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-50 mt-10">
            <div className="text-gray-400">暂未有服务运行</div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PreviewIframe;
