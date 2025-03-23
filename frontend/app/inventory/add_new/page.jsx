'use client';
import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';

// Safe localStorage utility functions with improved error handling
const safeLocalStorage = {
  getItem: (key) => {
    if (typeof window === 'undefined') return null;
    try {
      return window.localStorage.getItem(key);
    } catch (e) {
      // Use a safer error reporting method
      try {
        console.error('Error accessing localStorage:', e.message || 'Unknown error');
      } catch (_) {
        // Fallback if console.error fails
      }
      return null;
    }
  },
  
  setItem: (key, value) => {
    if (typeof window === 'undefined') return false;
    try {
      window.localStorage.setItem(key, value);
      return true;
    } catch (e) {
      // Use a safer error reporting method
      try {
        console.log('Error setting localStorage:', e.message || 'Unknown error');
      } catch (_) {
        // Fallback if console.log fails
      }
      return false;
    }
  },
  
  removeItem: (key) => {
    if (typeof window === 'undefined') return false;
    try {
      window.localStorage.removeItem(key);
      return true;
    } catch (e) {
      try {
        console.log('Error removing from localStorage:', e.message || 'Unknown error');
      } catch (_) {
        // Fallback if console.log fails
      }
      return false;
    }
  }
};

export default function AddNewItem() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isEditMode = searchParams.get('edit') === 'true';
  const editItemId = searchParams.get('itemId');
  
  // Add isMounted state to ensure we don't use localStorage during SSR
  const [isMounted, setIsMounted] = useState(false);
  const [formData, setFormData] = useState({
    itemCode: '',
    itemName: '',
    price: '',
    size: '',
    category: '',
    stockLevel: 0,
    material: 'PVC',
    description: '',
  });
  const [imagePreview, setImagePreview] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Set isMounted to true once component mounts
  useEffect(() => {
    setIsMounted(true);
    // Remove auto-generation of item code
  }, []);
  
  // Load item data if in edit mode - only after mounting
  useEffect(() => {
    if (!isMounted || !isEditMode) return;
    
    try {
      const itemToUpdate = safeLocalStorage.getItem('itemToUpdate');
      if (itemToUpdate) {
        const parsedItem = JSON.parse(itemToUpdate);
        
        // Log the item we're trying to edit for debugging
        console.log("Loading item for editing:", parsedItem);
        
        setFormData({
          itemCode: parsedItem.itemCode || '',
          itemName: parsedItem.name || parsedItem.itemName || '',
          price: parsedItem.price || '',
          size: parsedItem.size || '',
          category: parsedItem.category || '',
          stockLevel: parsedItem.stockLevel || 0,
          material: parsedItem.material || 'PVC',
          description: parsedItem.description || '',
          id: parsedItem.id, // Keep the original ID for updating
          // Store any other original data we need for finding the item
          originalItemCode: parsedItem.itemCode
        });
        
        // Set image preview if available
        if (parsedItem.image) {
          setImagePreview(parsedItem.image);
        }
      }
    } catch (error) {
      console.error("Error loading item data for editing:", error);
    }
  }, [isEditMode, isMounted]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Check file size - limit to 2MB to avoid localStorage issues
      if (file.size > 2 * 1024 * 1024) {
        alert("Image is too large. Please select an image under 2MB.");
        return;
      }
      
      const reader = new FileReader();
      reader.onloadend = () => {
        // Store image data in our state
        setImagePreview(reader.result);
        console.log("Image loaded successfully, size:", Math.round(reader.result.length / 1024), "KB");
      };
      reader.onerror = () => {
        console.error("Error reading file");
        alert("There was an error processing this image. Please try another.");
      };
      reader.readAsDataURL(file);
    }
  };

  // Store or update item in localStorage
  const storeAddedItem = (item, isUpdate = false) => {
    // Only execute once mounted
    if (!isMounted) {
      try { console.log("Component not mounted yet, cannot access localStorage"); } catch (_) {}
      return false;
    }
    
    try {
      // Get existing items or initialize empty array
      const existingItems = safeLocalStorage.getItem('recentlyAddedItems');
      let items = [];
      
      if (existingItems) {
        try {
          items = JSON.parse(existingItems);
          if (!Array.isArray(items)) {
            console.warn("Stored items was not an array, resetting");
            items = [];
          }
        } catch (parseError) {
          console.error("Error parsing stored items:", parseError);
          items = [];
        }
      }
      
      // IMPORTANT: Prepare the item with correct structure and validate image
      const itemToStore = {
        ...item,
        id: item.id || Date.now(),
        name: item.itemName || "Unnamed Item", // Ensure name field is set
        itemName: item.itemName || "Unnamed Item", // Keep both for consistency
        material: item.material || "Unknown",
        size: item.size || "Standard",
        stockLevel: Number(item.stockLevel) || 0,
        price: Number(item.price) || 0,
        dateAdded: item.dateAdded || new Date().toISOString(),
        dateModified: new Date().toISOString(),
        // Make sure image is properly stored
        image: item.image || null,
        // Add a flag to indicate if there's an image
        hasImage: !!item.image
      };
      
      // Log what we're storing for debugging
      console.log(`${isUpdate ? 'Updating' : 'Adding'} item with image:`, !!itemToStore.image);
      
      if (isUpdate) {
        // Try to find the item by ID first, then by itemCode as fallback
        let index = items.findIndex(i => i.id === item.id);
        
        // If not found by ID, try to find by itemCode
        if (index === -1 && item.originalItemCode) {
          index = items.findIndex(i => i.itemCode === item.originalItemCode);
          console.log(`Item not found by ID, searching by itemCode ${item.originalItemCode}, found at index: ${index}`);
        }
        
        if (index !== -1) {
          // Keep the original ID if it exists
          itemToStore.id = items[index].id || itemToStore.id;
          items[index] = itemToStore;
          console.log(`Updated item at index ${index}:`, itemToStore);
        } else {
          // If item not found, add it as new
          items.unshift(itemToStore);
          console.log("Item not found for update, adding as new:", itemToStore);
        }
      } else {
        // Add new item to the beginning of the array
        items.unshift(itemToStore);
        console.log("Added new item:", itemToStore);
      }
      
      // Keep only the last 20 items
      if (items.length > 20) {
        items = items.slice(0, 20);
      }
      
      // Extra safety check for browser environment
      if (typeof window === 'undefined' || !window.localStorage) {
        console.log("Window or localStorage not available");
        return false;
      }
      
      // Use our safe method instead of direct access
      const success = safeLocalStorage.setItem('recentlyAddedItems', JSON.stringify(items));
      
      if (success) {
        console.log("Successfully stored items with length:", items.length);
      } else {
        console.log("Failed to store items");
      }
      
      // Clean up if we were updating
      if (isUpdate && success) {
        safeLocalStorage.removeItem('itemToUpdate');
      }
      
      // Extra safety check for image size
      try {
        const totalSize = JSON.stringify(items).length;
        console.log(`Total localStorage size: ~${Math.round(totalSize / 1024)}KB`);
        // Warning if over 4MB (localStorage typical limit is ~5MB)
        if (totalSize > 4 * 1024 * 1024) {
          console.warn("WARNING: localStorage size is approaching the limit!");
        }
      } catch (e) {}
      
      return success;
    } catch (error) {
      try { console.log("Error in storeAddedItem function:", error.message || "Unknown error"); } catch (_) {}
      return false;
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Don't do anything if not mounted
    if (!isMounted) {
      console.warn("Cannot submit form - component not mounted");
      return;
    }
    
    setIsSubmitting(true);
    
    // Prepare the item data with additional fields
    const itemToSave = {
      ...formData,
      name: formData.itemName, // Ensure name field matches expected format in added_items page
      id: formData.id || Date.now(),
      itemCode: formData.itemCode || `ITEM${Math.floor(Math.random() * 10000)}`,
      dateAdded: isEditMode ? formData.dateAdded : new Date().toISOString(),
      dateModified: new Date().toISOString(),
      // Make sure image is properly included
      image: imagePreview,
      // Include the original itemCode to help with matching if ID fails
      originalItemCode: formData.originalItemCode
    };
    
    console.log(`${isEditMode ? 'Updating' : 'Adding'} item with ID: ${itemToSave.id}, Code: ${itemToSave.itemCode}`);
    
    // Store data
    const saved = storeAddedItem(itemToSave, isEditMode);
    
    // Navigate with a unique timestamp to force page refresh
    setTimeout(() => {
      router.push(`/added_items?category=${formData.category || 'items'}&success=${saved ? 'true' : 'false'}&action=${isEditMode ? 'updated' : 'added'}&t=${Date.now()}`);
    }, 500); // Small delay to show submitting state
  };

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-lg p-8">
        <h1 className="text-3xl font-bold text-yellow-500 mb-8">
          {isEditMode ? 'Update Item' : 'Add New Item'}
        </h1>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Image Upload */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">Item Image</label>
            <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-lg">
              <div className="space-y-1 text-center">
                {imagePreview ? (
                  <div className="relative w-48 h-48 mx-auto">
                    <Image
                      src={imagePreview}
                      alt="Preview"
                      fill
                      className="object-contain"
                    />
                  </div>
                ) : (
                  <div className="mx-auto h-48 w-48 flex items-center justify-center">
                    <svg className="h-24 w-24 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                      <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                )}
                <div className="flex justify-center text-sm text-gray-600">
                  <label className="relative cursor-pointer bg-white rounded-md font-medium text-yellow-500 hover:text-yellow-400">
                    <span>Upload a file</span>
                    <input type="file" className="sr-only" onChange={handleImageUpload} accept="image/*" />
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* Item Code - Modified to be manually entered */}
          <div>
            <label className="block text-sm font-medium text-gray-700">Item Code</label>
            <input
              type="text"
              name="itemCode"
              value={formData.itemCode}
              onChange={handleInputChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-yellow-500 focus:ring-yellow-500"
              readOnly={isEditMode} // Only read-only in edit mode
              required // Make it required
            />
            <p className="mt-1 text-xs text-gray-500">
              {isEditMode 
                ? "Item codes cannot be changed after creation" 
                : "Enter a unique code for this item (e.g., PVC-12345)"
              }
            </p>
          </div>

          {/* Item Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700">Item Name</label>
            <input
              type="text"
              name="itemName"
              value={formData.itemName}
              onChange={handleInputChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-yellow-500 focus:ring-yellow-500"
              required
            />
          </div>

          {/* Price */}
          <div>
            <label className="block text-sm font-medium text-gray-700">Price</label>
            <div className="mt-1 relative rounded-md shadow-sm">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <span className="text-gray-500 sm:text-sm">Rs</span>
              </div>
              <input
                type="number"
                name="price"
                value={formData.price}
                onChange={handleInputChange}
                className="mt-1 block w-full pl-7 rounded-md border-gray-300 shadow-sm focus:border-yellow-500 focus:ring-yellow-500"
                placeholder="0.00"
                required
              />
            </div>
          </div>

          {/* Size */}
          <div>
            <label className="block text-sm font-medium text-gray-700">Size</label>
            <input
              type="text"
              name="size"
              value={formData.size}
              onChange={handleInputChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-yellow-500 focus:ring-yellow-500"
              placeholder="e.g., 12 inches"
              required
            />
          </div>
          
          {/* Material */}
          <div>
            <label className="block text-sm font-medium text-gray-700">Material</label>
            <input
              type="text"
              name="material"
              value={formData.material}
              onChange={handleInputChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-yellow-500 focus:ring-yellow-500"
              placeholder="e.g., PVC, Metal"
              required
            />
          </div>
          
          {/* Stock Level */}
          <div>
            <label className="block text-sm font-medium text-gray-700">Initial Stock Level</label>
            <input
              type="number"
              name="stockLevel"
              value={formData.stockLevel}
              onChange={handleInputChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-yellow-500 focus:ring-yellow-500"
              min="0"
              required
            />
          </div>

          {/* Category Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700">Category</label>
            <select
              name="category"
              value={formData.category}
              onChange={handleInputChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-yellow-500 focus:ring-yellow-500"
              required
            >
              <option value="">Select a category</option>
              <option value="pipes">Pipes</option>
              <option value="fittings">Fittings</option>
              <option value="valves">Valves</option>
              <option value="tools">Tools</option>
              <option value="fixtures">Fixtures</option>
              <option value="sealants">Sealants</option>
              <option value="safety">Safety Equipment</option>
              <option value="others">Others</option>
            </select>
            
            {/* Category help text */}
            <p className="mt-1 text-sm text-gray-500">
              Items will appear in their respective category section
            </p>
          </div>

          {/* Submit Button */}
          <div className="flex justify-center">
            <button
              type="submit"
              className="bg-yellow-500 text-white px-12 py-3 rounded-lg hover:bg-yellow-400 transition-colors duration-300 font-semibold text-lg"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <span className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Processing...
                </span>
              ) : (
                isEditMode ? 'Update Item' : 'Add Item'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
