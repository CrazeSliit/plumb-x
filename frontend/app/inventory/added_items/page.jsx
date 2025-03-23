'use client';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import { 
  HomeIcon, 
  ChevronRightIcon, 
  CheckCircleIcon, 
  PlusCircleIcon,
  ArrowLeftIcon,
  ArrowDownTrayIcon,
  DocumentMagnifyingGlassIcon,
  PencilIcon,
  TrashIcon
} from '@heroicons/react/24/outline';

export default function AddedItemsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [addedItems, setAddedItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleteConfirmItem, setDeleteConfirmItem] = useState(null);
  const categoryParam = searchParams.get('category') || 'items';
  const successParam = searchParams.get('success') === 'true';
  const actionParam = searchParams.get('action') || '';
  
  // Add this to force refresh when timestamp changes
  const timestamp = searchParams.get('t');
  
  useEffect(() => {
    // Retrieve items from localStorage
    const fetchAddedItems = () => {
      setLoading(true);
      try {
        if (typeof window !== 'undefined') {
          console.log("Fetching items from localStorage");
          
          // Use direct access for simplicity
          const storedItems = window.localStorage.getItem('recentlyAddedItems');
          console.log("Raw stored items length:", storedItems?.length || 0);
          
          if (storedItems) {
            try {
              const parsedItems = JSON.parse(storedItems);
              
              // Verify if the parsed data is an array
              if (Array.isArray(parsedItems)) {
                console.log(`Found ${parsedItems.length} items in localStorage`);
                
                // Check for image data in items (debugging)
                parsedItems.forEach((item, idx) => {
                  console.log(`Item ${idx} has image: ${!!item.image}`);
                });
                
                // Make sure we have valid items
                const validItems = parsedItems.filter(item => item && item.id);
                setAddedItems(validItems);
              } else {
                console.error("Stored items is not an array:", typeof parsedItems);
                setAddedItems([]);
              }
            } catch (parseError) {
              console.error("Error parsing stored items:", parseError);
              setAddedItems([]);
            }
          } else {
            console.log("No items found in localStorage");
            setAddedItems([]);
          }
        }
      } catch (error) {
        console.error("Error retrieving items:", error);
        setAddedItems([]);
      } finally {
        setLoading(false);
      }
    };
    
    fetchAddedItems();
    
    // Add event listener for storage changes
    const handleStorageChange = (e) => {
      if (e.key === 'recentlyAddedItems') {
        console.log("localStorage updated externally, refreshing items");
        fetchAddedItems();
      }
    };
    
    if (typeof window !== 'undefined') {
      window.addEventListener('storage', handleStorageChange);
    }
    
    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('storage', handleStorageChange);
      }
    };
    
  // Add timestamp to dependency array to force refresh when timestamp changes
  }, [timestamp]);
  
  // Clear added items from storage
  const handleClearItems = () => {
    if (confirm('Are you sure you want to clear all items?') && typeof window !== 'undefined') {
      localStorage.removeItem('recentlyAddedItems');
      setAddedItems([]);
    }
  };

  // Delete a specific item
  const handleDeleteItem = (item) => {
    setDeleteConfirmItem(null); // Close confirmation dialog
    
    if (typeof window === 'undefined') return;
    
    try {
      // Filter out the item to delete
      const updatedItems = addedItems.filter(i => i.id !== item.id);
      
      // Update localStorage
      localStorage.setItem('recentlyAddedItems', JSON.stringify(updatedItems));
      
      // Update state
      setAddedItems(updatedItems);
    } catch (error) {
      console.error("Error deleting item:", error);
      alert('Failed to delete item. Please try again.');
    }
  };

  // Handle updating an item by navigating to the add_new page with prefilled data
  const handleUpdateItem = (item) => {
    // Store the item to be updated in localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem('itemToUpdate', JSON.stringify(item));
    }
    
    // Navigate to add_new page with edit mode flag
    router.push(`/add_new?edit=true&itemId=${item.id}`);
  };
  
  // Format category label
  const getCategoryLabel = (category) => {
    const categoryMap = {
      'pipes': 'PVC Pipes',
      'fittings': 'Fittings',
      'valves': 'Valves',
      'tools': 'Tools',
      'fixtures': 'Fixtures',
      'sealants': 'Sealants',
      'safety': 'Safety Equipment',
      'items': 'Items'
    };
    
    return categoryMap[category] || 'Items';
  };

  // Add this new function to the component
  const ItemImage = ({ item }) => {
    const [error, setError] = useState(false);
    
    // If no image or error loading, show placeholder with initial
    if (!item.image || error) {
      return (
        <div className="h-full w-full flex items-center justify-center bg-gray-200">
          <span className="text-xl font-medium text-gray-600">
            {item.category ? item.category.charAt(0).toUpperCase() : 'I'}
          </span>
        </div>
      );
    }
    
    // Try to render the image with error handling
    return (
      <div className="relative h-full w-full">
        <img 
          src={item.image} 
          alt={item.name || 'Item'} 
          className="object-cover h-full w-full"
          onError={() => setError(true)}
        />
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Breadcrumb */}
        <nav className="flex mb-4" aria-label="Breadcrumb">
          <ol className="inline-flex items-center space-x-1 md:space-x-3">
            <li className="inline-flex items-center">
              <Link href="/dashboard" className="flex items-center text-sm font-medium text-gray-700 hover:text-[#fdc501]">
                <HomeIcon className="w-4 h-4 mr-2"/>
                Dashboard
              </Link>
            </li>
            <li>
              <div className="flex items-center">
                <ChevronRightIcon className="w-5 h-5 text-gray-400"/>
                <Link href="/inventory_management" className="ml-1 text-sm font-medium text-gray-700 hover:text-[#fdc501] md:ml-2">
                  Inventory
                </Link>
              </div>
            </li>
            <li>
              <div className="flex items-center">
                <ChevronRightIcon className="w-5 h-5 text-gray-400"/>
                <Link href="/add_new" className="ml-1 text-sm font-medium text-gray-700 hover:text-[#fdc501] md:ml-2">
                  Add New
                </Link>
              </div>
            </li>
            <li aria-current="page">
              <div className="flex items-center">
                <ChevronRightIcon className="w-5 h-5 text-gray-400"/>
                <span className="ml-1 text-sm font-medium text-gray-500 md:ml-2">Added Items</span>
              </div>
            </li>
          </ol>
        </nav>
        
        {/* Success messages */}
        {successParam && (
          <div className="bg-green-50 border-l-4 border-green-500 p-4 mb-6 rounded-md">
            <div className="flex items-center">
              <CheckCircleIcon className="h-6 w-6 text-green-500 mr-3" />
              <p className="text-green-700 font-medium">
                {actionParam === 'updated' 
                  ? 'Item successfully updated!' 
                  : `Item${addedItems.length > 1 ? 's' : ''} successfully added to inventory!`}
              </p>
            </div>
          </div>
        )}
        
        {/* Header */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Recently Added {getCategoryLabel(categoryParam)}</h1>
              <p className="text-gray-600 mt-1">View and manage items recently added to your inventory</p>
            </div>
            <div className="mt-4 sm:mt-0 flex gap-3">
              <Link 
                href={`/category/${categoryParam !== 'items' ? categoryParam : 'pipes'}`}
                className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50"
              >
                <DocumentMagnifyingGlassIcon className="mr-2 h-5 w-5" />
                View Inventory
              </Link>
              <Link 
                href={`/add_new?category=${categoryParam !== 'items' ? categoryParam : 'pipes'}`}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-black bg-[#fdc501] hover:bg-yellow-400"
              >
                <PlusCircleIcon className="mr-2 h-5 w-5" />
                Add More
              </Link>
            </div>
          </div>
        </div>
        
        {/* Added Items List */}
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#fdc501]"></div>
          </div>
        ) : addedItems.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
              <DocumentMagnifyingGlassIcon className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="mt-4 text-lg font-medium text-gray-900">No recently added items</h3>
            <p className="mt-1 text-gray-500">
              You haven't added any items recently or they've been cleared from local storage.
            </p>
            <div className="mt-6">
              <Link
                href="/add_new"
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-black bg-[#fdc501] hover:bg-yellow-400"
              >
                <PlusCircleIcon className="mr-2 h-5 w-5" />
                Add New Item
              </Link>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="px-4 py-5 sm:px-6 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                Added Items ({addedItems.length})
              </h3>
              <div className="flex space-x-2">
                <button
                  onClick={() => console.log("Current items in state:", addedItems)}
                  className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                >
                  Debug
                </button>
                <button
                  onClick={handleClearItems}
                  className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                >
                  Clear All
                </button>
              </div>
            </div>
            
            <ul className="divide-y divide-gray-200">
              {addedItems.map((item, index) => (
                <li key={`item-${item.id || index}-${index}`} className="px-4 py-4 sm:px-6 hover:bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      {/* Image container with error handling */}
                      <div className="flex-shrink-0 h-16 w-16 relative rounded-md overflow-hidden bg-gray-100">
                        <ItemImage item={item} />
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{item.name || item.itemName || 'Unnamed Item'}</div>
                        <div className="text-sm text-gray-500">
                          {item.itemCode || 'No Code'} • {item.material || 'N/A'} • {item.size || 'N/A'}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <div className="text-sm text-gray-500">Stock Level</div>
                        <div className="text-sm font-medium text-gray-900">{item.stockLevel} units</div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm text-gray-500">Price</div>
                        <div className="text-sm font-medium text-gray-900">Rs{item.price}</div>
                      </div>
                      
                      {/* Action buttons */}
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleUpdateItem(item)}
                          className="inline-flex items-center px-2.5 py-1.5 border border-gray-300 text-xs font-medium rounded text-blue-600 bg-white hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        >
                          <PencilIcon className="h-3.5 w-3.5 mr-1" />
                          Update
                        </button>
                        
                        <button
                          onClick={() => setDeleteConfirmItem(item)}
                          className="inline-flex items-center px-2.5 py-1.5 border border-gray-300 text-xs font-medium rounded text-red-600 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                        >
                          <TrashIcon className="h-3.5 w-3.5 mr-1" />
                          Delete
                        </button>
                        
                        <Link
                          href={`/inventory/item/${item.itemCode}`}
                          className="inline-flex items-center px-2.5 py-1.5 border border-transparent text-xs font-medium rounded text-[#fdc501] hover:bg-yellow-50 hover:text-yellow-700 focus:outline-none"
                        >
                          Details
                        </Link>
                      </div>
                    </div>
                  </div>
                  
                  {/* Delete confirmation */}
                  {deleteConfirmItem && deleteConfirmItem.id === item.id && (
                    <div className="mt-3 bg-red-50 p-3 rounded-md">
                      <p className="text-sm text-red-700">Are you sure you want to delete this item?</p>
                      <div className="mt-2 flex justify-end gap-2">
                        <button
                          onClick={() => setDeleteConfirmItem(null)}
                          className="px-3 py-1 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => handleDeleteItem(item)}
                          className="px-3 py-1 text-xs font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  )}
                </li>
              ))}
            </ul>
            
            <div className="px-4 py-4 sm:px-6 bg-gray-50 border-t border-gray-200">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-500">
                  {addedItems.length} item{addedItems.length !== 1 ? 's' : ''} added recently
                </div>
                <Link
                  href="/inventory_report"
                  className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                >
                  <ArrowDownTrayIcon className="mr-2 h-4 w-4" />
                  Export Items
                </Link>
              </div>
            </div>
          </div>
        )}
        
        {/* Back button */}
        <div className="mt-6">
          <button
            onClick={() => router.back()}
            className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
          >
            <ArrowLeftIcon className="mr-2 h-5 w-5" />
            Go Back
          </button>
        </div>
      </div>
    </div>
  );
}