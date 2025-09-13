// Simple test to verify default image loading
// This can be run in the browser console to test the functionality

async function testDefaultImageLoading() {
  console.log('Testing default image loading...');

  try {
    // Test if the image is accessible
    const response = await fetch('/carv-hero-home-small.png');
    console.log('Image fetch response:', response.status, response.statusText);

    if (response.ok) {
      const blob = await response.blob();
      console.log('Image blob size:', blob.size, 'bytes');
      console.log('Image blob type:', blob.type);

      // Test creating a File object
      const file = new File([blob], 'carv-hero-home-small.png', {
        type: blob.type || 'image/png',
      });

      console.log('Created file object:', {
        name: file.name,
        size: file.size,
        type: file.type,
        lastModified: file.lastModified,
      });

      console.log('✅ Default image loading test passed!');
      return true;
    } else {
      console.error('❌ Failed to fetch default image');
      return false;
    }
  } catch (error) {
    console.error('❌ Error testing default image loading:', error);
    return false;
  }
}

// Run the test
testDefaultImageLoading();
