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
// ✅ FIXED: Ensure proper file-to-bytes conversion
export const fileToBytes = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    
    reader.onload = (event) => {
      try {
        const arrayBuffer = event.target.result
        const uint8Array = new Uint8Array(arrayBuffer)
        console.log('File converted to bytes:', {
          originalSize: file.size,
          bytesLength: uint8Array.length,
          fileType: file.type,
          fileName: file.name
        })
        resolve(uint8Array)
      } catch (error) {
        console.error('Error converting file to bytes:', error)
        reject(error)
      }
    }
    
    reader.onerror = (error) => {
      console.error('FileReader error:', error)
      reject(error)
    }
    
    // ✅ CRITICAL: Use readAsArrayBuffer for binary files
    reader.readAsArrayBuffer(file)
  })
}

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

// ✅ NEW: Verify file integrity by comparing hashes
export const verifyFileIntegrity = async (originalFile, reconstructedBytes) => {
  try {
    // Generate hash of original file
    const originalHash = await generateFileHash(originalFile)
    
    // Convert bytes back to blob for hashing
    const blob = new Blob([new Uint8Array(reconstructedBytes)])
    const reconstructedFile = new File([blob], originalFile.name, { type: originalFile.type })
    const reconstructedHash = await generateFileHash(reconstructedFile)
    
    const isValid = originalHash === reconstructedHash
    
    console.log('🔍 File integrity check:', {
      originalSize: originalFile.size,
      reconstructedSize: reconstructedBytes.length,
      originalHash: originalHash.substring(0, 16) + '...',
      reconstructedHash: reconstructedHash.substring(0, 16) + '...',
      isValid
    })
    
    return {
      isValid,
      originalHash,
      reconstructedHash,
      originalSize: originalFile.size,
      reconstructedSize: reconstructedBytes.length
    }
  } catch (error) {
    console.error('❌ Error verifying file integrity:', error)
    return { isValid: false, error: error.message }
  }
}

// ✅ NEW: Get proper MIME type for VR files
export const getVRFileMimeType = (fileName, fileType) => {
  // Use provided file type if available
  if (fileType && fileType !== 'application/octet-stream') {
    return fileType
  }
  
  // Determine from file extension
  const extension = fileName.toLowerCase().slice(fileName.lastIndexOf('.'))
  
  switch (extension) {
    case '.glb':
      return 'model/gltf-binary'
    case '.gltf':
      return 'model/gltf+json'
    case '.obj':
      return 'text/plain'
    case '.fbx':
      return 'application/octet-stream'
    case '.jpg':
    case '.jpeg':
      return 'image/jpeg'
    case '.png':
      return 'image/png'
    case '.webp':
      return 'image/webp'
    default:
      return 'application/octet-stream'
  }
}

// ✅ NEW: Test file conversion round-trip
export const testFileConversion = async (file) => {
  try {
    console.log('🧪 Testing file conversion for:', file.name)
    
    // Convert to bytes
    const bytes = await fileToBytes(file)
    
    // Convert back to blob
    const mimeType = getVRFileMimeType(file.name, file.type)
    const blob = bytesToBlob(bytes, mimeType)
    
    // Verify integrity
    const integrity = await verifyFileIntegrity(file, bytes)
    
    console.log('🧪 Conversion test results:', {
      originalFile: {
        name: file.name,
        size: file.size,
        type: file.type
      },
      convertedBlob: {
        size: blob.size,
        type: blob.type
      },
      bytesLength: bytes.length,
      integrity
    })
    
    return {
      success: integrity.isValid,
      blob,
      bytes,
      integrity
    }
  } catch (error) {
    console.error('❌ File conversion test failed:', error)
    return { success: false, error: error.message }
  }
}
