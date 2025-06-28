import { Principal } from '@dfinity/principal'

// Format ICP amounts from e8s to human readable format
export const formatICP = (e8s) => {
  const icp = Number(e8s) / 100000000; // 1 ICP = 100,000,000 e8s
  return icp.toFixed(4);
};

// Convert ICP to e8s for canister calls
export const icpToE8s = (icp) => {
  return Math.floor(Number(icp) * 100000000);
};

// Format file size in human readable format
export const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

// Format timestamp to readable date
export const formatDate = (timestamp) => {
  const date = new Date(Number(timestamp) / 1000000); // Convert nanoseconds to milliseconds
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

// Format relative time (e.g., "2 hours ago")
export const formatRelativeTime = (timestamp) => {
  const now = Date.now();
  const date = new Date(Number(timestamp) / 1000000);
  const diffInSeconds = Math.floor((now - date.getTime()) / 1000);
  
  if (diffInSeconds < 60) {
    return 'Just now';
  } else if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60);
    return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
  } else if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600);
    return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  } else if (diffInSeconds < 2592000) {
    const days = Math.floor(diffInSeconds / 86400);
    return `${days} day${days > 1 ? 's' : ''} ago`;
  } else {
    return formatDate(timestamp);
  }
};

// Truncate text with ellipsis
export const truncateText = (text, maxLength = 50) => {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + '...';
};

// Validate file type for VR assets
export const isValidVRFile = (file) => {
  const validExtensions = ['.glb', '.gltf', '.obj', '.fbx'];
  const validMimeTypes = [
    'model/gltf-binary',
    'model/gltf+json',
    'application/octet-stream'
  ];
  
  const extension = file.name.toLowerCase().slice(file.name.lastIndexOf('.'));
  return validExtensions.includes(extension) || validMimeTypes.includes(file.type);
};

// Validate image file for preview
export const isValidImageFile = (file) => {
  const validMimeTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  return validMimeTypes.includes(file.type);
};

// Generate a hash for file identification (simple version)
export const generateFileHash = async (file) => {
  const arrayBuffer = await file.arrayBuffer();
  const hashBuffer = await crypto.subtle.digest('SHA-256', arrayBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
};

// Create object URL for file preview
export const createObjectURL = (file) => {
  return URL.createObjectURL(file);
};

// Cleanup object URL
export const revokeObjectURL = (url) => {
  URL.revokeObjectURL(url);
};

// Parse principal from string
export const parsePrincipal = (principalString) => {
  try {
    return Principal.fromText(principalString);
  } catch (error) {
    console.error('Invalid principal:', error);
    return null;
  }
};

// Format principal for display (shortened)
export const formatPrincipal = (principal) => {
  if (!principal) return '';
  const principalString = principal.toString();
  if (principalString.length <= 20) return principalString;
  return `${principalString.slice(0, 8)}...${principalString.slice(-8)}`;
};

// Debounce function for search
export const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

// Copy text to clipboard
export const copyToClipboard = async (text) => {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (error) {
    console.error('Failed to copy to clipboard:', error);
    return false;
  }
};

// Check if WebXR is supported
export const isWebXRSupported = () => {
  return 'xr' in navigator;
};

// Check if VR is supported
export const isVRSupported = async () => {
  if (!isWebXRSupported()) return false;
  
  try {
    const supported = await navigator.xr.isSessionSupported('immersive-vr');
    return supported;
  } catch (error) {
    return false;
  }
};

// Asset categories
export const ASSET_CATEGORIES = [
  'Environments',
  'Characters',
  'Vehicles',
  'Architecture',
  'Furniture',
  'Weapons',
  'Tools',
  'Nature',
  'Abstract',
  'Other'
];

// Transaction status labels
export const TRANSACTION_STATUS_LABELS = {
  Pending: 'Pending',
  Completed: 'Completed',
  Failed: 'Failed',
  Cancelled: 'Cancelled'
};

// Get status color for UI
export const getStatusColor = (status) => {
  switch (status) {
    case 'Pending':
      return 'bg-yellow-100 text-yellow-800';
    case 'Completed':
      return 'bg-green-100 text-green-800';
    case 'Failed':
      return 'bg-red-100 text-red-800';
    case 'Cancelled':
      return 'bg-gray-100 text-gray-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

// Convert file to byte array for canister upload
export const fileToBytes = async (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const arrayBuffer = reader.result;
      const uint8Array = new Uint8Array(arrayBuffer);
      resolve(Array.from(uint8Array));
    };
    reader.onerror = reject;
    reader.readAsArrayBuffer(file);
  });
};

// Convert bytes array back to blob/file
export const bytesToBlob = (bytes, mimeType = 'application/octet-stream') => {
  const uint8Array = new Uint8Array(bytes);
  return new Blob([uint8Array], { type: mimeType });
};

// Create download URL from file bytes
export const createDownloadURL = (bytes, mimeType = 'application/octet-stream') => {
  const blob = bytesToBlob(bytes, mimeType);
  return URL.createObjectURL(blob);
};
