
interface DebugInfoProps {
  qrCode: string;
  renderKey: number;
  isWaitingQR: boolean;
  connectionStatus: string;
}

export const DebugInfo: React.FC<DebugInfoProps> = ({
  qrCode,
  renderKey,
  isWaitingQR,
  connectionStatus
}) => {
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  return (
    <div className="text-xs text-gray-400 mt-2 space-y-1">
      <div>QR Code length: {qrCode?.length || 0}</div>
      <div>Has QR: {!!qrCode ? 'Yes' : 'No'}</div>
      <div>Render Key: {renderKey}</div>
      <div>Is Waiting QR: {isWaitingQR ? 'Yes' : 'No'}</div>
      <div>Connection Status: {connectionStatus}</div>
      <div>QR Preview: {qrCode?.substring(0, 30)}...</div>
    </div>
  );
};
