'use client';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  HomeIcon, 
  ChevronRightIcon, 
  MagnifyingGlassIcon,
  ArrowPathIcon,
  PlusCircleIcon,
  ChartBarIcon,
  ArrowDownTrayIcon
} from '@heroicons/react/24/outline';
import { sampleFittingsData } from '../../../data/sampleData';

// Add this helper function to load items from localStorage
const loadStoredItems = () => {
  try {
    if (typeof window !== 'undefined') {
      const storedItems = window.localStorage.getItem('recentlyAddedItems');
      if (storedItems) {
        const parsedItems = JSON.parse(storedItems);
        if (Array.isArray(parsedItems)) {
          // Filter to only include fitting items
          const fittingItems = parsedItems.filter(item => 
            item.category === 'fittings' || 
            item.category === 'Fittings' ||
            (item.name && (
              item.name.toLowerCase().includes('elbow') ||
              item.name.toLowerCase().includes('tee') ||
              item.name.toLowerCase().includes('coupling')
            ))
          );
          
          console.log(`Found ${fittingItems.length} fitting items in localStorage`);
          return fittingItems.map(item => ({
            id: item.id || item.itemCode,
            name: item.name || item.itemName,
            type: item.type || 'Fitting',
            material: item.material || 'PVC',
            size: item.size || 'Standard',
            stockLevel: Number(item.stockLevel) || 0,
            reorderLevel: 15, // Default value
            price: Number(item.price) || 0,
            value: Number(item.price * item.stockLevel) || 0,
            location: item.location || 'Storage',
            image: item.image || '/image/fitting-placeholder.jpg',
            lastRestocked: item.dateModified ? new Date(item.dateModified).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
            description: item.description || 'No description available'
          }));
        }
      }
    }
    return null;
  } catch (error) {
    console.error("Error loading items from localStorage:", error);
    return null;
  }
};

export default function FittingsPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState('name');
  const [sortDirection, setSortDirection] = useState('asc');
  
  // Category statistics
  const [stats, setStats] = useState({
    total: 0,
    lowStock: 0,
    value: 0,
    types: 0
  });
  
  useEffect(() => {
    // Fetch category items
    const fetchItems = async () => {
      setLoading(true);
      
      // First try to load items from localStorage
      const storedFittingItems = loadStoredItems();
      
      // Use the imported sample data
      const data = sampleFittingsData;
      
      // Combine localStorage items with sample data
      let combinedData = [];
      
      if (storedFittingItems && storedFittingItems.length > 0) {
        // Start with stored items
        combinedData = [...storedFittingItems];
        
        // Add sample items that don't conflict with stored items
        const existingIds = new Set(storedFittingItems.map(item => item.id));
        const uniqueSampleItems = data.filter(item => !existingIds.has(item.id));
        
        combinedData = [...combinedData, ...uniqueSampleItems];
        console.log(`Showing ${storedFittingItems.length} stored items and ${uniqueSampleItems.length} sample items`);
      } else {
        combinedData = data;
        console.log("No stored items found, using sample data");
      }
      
      // Calculate statistics
      const totalValue = combinedData.reduce((sum, item) => sum + item.value, 0);
      const lowStockItems = combinedData.filter(item => item.stockLevel < item.reorderLevel).length;
      const uniqueTypes = new Set(combinedData.map(item => item.type)).size;
      
      setStats({
          total: combinedData.length,
          lowStock: lowStockItems,
          value: totalValue,
          types: uniqueTypes
      });
      
      // Simulate network delay
      setTimeout(() => {
        setItems(combinedData);
        setLoading(false);
      }, 500);
    };
    
    fetchItems();
  }, []);

  // Handle sorting
  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };
  
  // Filter items based on search, filter, and sort
  const filteredItems = items
    .filter(item => {
      // Filter by material if not 'all'
      if (filter !== 'all' && item.material.toLowerCase() !== filter.toLowerCase()) {
        return false;
      }
      
      // Search by name, type, or size
      if (searchTerm && !item.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
          !item.type.toLowerCase().includes(searchTerm.toLowerCase()) &&
          !item.size.toLowerCase().includes(searchTerm.toLowerCase())) {
        return false;
      }
      
      return true;
    })
    .sort((a, b) => {
      let valueA = a[sortField];
      let valueB = b[sortField];

      // Convert to lowercase if string
      if (typeof valueA === 'string') valueA = valueA.toLowerCase();
      if (typeof valueB === 'string') valueB = valueB.toLowerCase();

      if (valueA < valueB) return sortDirection === 'asc' ? -1 : 1;
      if (valueA > valueB) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

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
            <li aria-current="page">
              <div className="flex items-center">
                <ChevronRightIcon className="w-5 h-5 text-gray-400"/>
                <span className="ml-1 text-sm font-medium text-gray-500 md:ml-2">Fittings</span>
              </div>
            </li>
          </ol>
        </nav>

        {/* Header section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Plumbing Fittings</h1>
            <p className="text-gray-600 mt-1">Browse our selection of high-quality plumbing fittings and connectors</p>
          </div>
          <div className="mt-4 md:mt-0 flex flex-wrap gap-2">
            <Link href="/add_new?category=fittings" className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-black bg-[#fdc501] hover:bg-yellow-400">
              <PlusCircleIcon className="mr-2 h-5 w-5" />
              Add New Fitting
            </Link>
            <Link href="/inventory_report?category=fittings" className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50">
              <ArrowDownTrayIcon className="mr-2 h-5 w-5" />
              Export
            </Link>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6 border-l-4 border-[#fdc501]">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Fittings</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              </div>
              <div className="p-3 bg-yellow-100 rounded-full">
                <ChartBarIcon className="h-6 w-6 text-yellow-600" />
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6 border-l-4 border-red-500">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm font-medium text-gray-600">Low Stock Items</p>
                <p className="text-2xl font-bold text-red-600">{stats.lowStock}</p>
              </div>
              <div className="p-3 bg-red-100 rounded-full">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6 border-l-4 border-blue-500">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Value</p>
                <p className="text-2xl font-bold text-gray-900">Rs{stats.value.toLocaleString()}</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-full">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6 border-l-4 border-green-500">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm font-medium text-gray-600">Fitting Types</p>
                <p className="text-2xl font-bold text-gray-900">{stats.types}</p>
              </div>
              <div className="p-3 bg-green-100 rounded-full">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#fdc501]"></div>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9.75 9.75l4.5 4.5m0-4.5l-4.5 4.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h3 className="mt-2 text-lg font-medium text-gray-900">No fittings found</h3>
            <p className="mt-1 text-gray-500">Try adjusting your search or filter to find what you're looking for.</p>
            <div className="mt-6">
              <button
                onClick={() => {setSearchTerm(''); setFilter('all');}}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-black bg-[#fdc501] hover:bg-yellow-400"
              >
                <ArrowPathIcon className="mr-2 h-5 w-5" />
                Reset Filters
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {filteredItems.map(item => (
              <div key={item.id} className="bg-white rounded-lg shadow-md overflow-hidden">
                <div className="relative h-48 bg-gray-200">
                  <img 
                    src={item.image || '/image/fitting-placeholder.jpg'} 
                    alt={item.name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = '/image/fitting-placeholder.jpg';
                    }}
                  />
                  <div 
                    className={`absolute top-2 right-2 py-1 px-2 rounded-md text-xs font-bold ${
                      item.stockLevel < item.reorderLevel 
                      ? 'bg-red-100 text-red-800 border border-red-300' 
                      : 'bg-green-100 text-green-800 border border-green-300'
                    }`}
                  >
                    {item.stockLevel < item.reorderLevel ? 'Low Stock' : 'In Stock'}
                  </div>
                </div>
                <div className="p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-lg font-medium text-gray-900">{item.name}</h3>
                      <div className="flex gap-2 mt-1">
                        <span className="inline-block px-2 py-0.5 bg-gray-100 text-gray-800 text-xs rounded-md">{item.type}</span>
                        <span className="inline-block px-2 py-0.5 bg-blue-100 text-blue-800 text-xs rounded-md">{item.material}</span>
                      </div>
                    </div>
                    <div className="text-lg font-bold text-gray-900">Rs{item.price}</div>
                  </div>
                  
                  <div className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                    <div>
                      <span className="text-gray-500">Size:</span>
                      <span className="ml-1 text-gray-900">{item.size}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Stock:</span>
                      <span className={`ml-1 ${
                        item.stockLevel < item.reorderLevel 
                        ? 'text-red-600 font-medium' 
                        : 'text-gray-900'
                      }`}>{item.stockLevel}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Location:</span>
                      <span className="ml-1 text-gray-900">{item.location}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Last Restocked:</span>
                      <span className="ml-1 text-gray-900">{item.lastRestocked}</span>
                    </div>
                  </div>
                  
                  <p className="mt-3 text-sm text-gray-500 line-clamp-2">{item.description}</p>
                  
                  <div className="mt-4 flex justify-between items-center">
                    <Link 
                      href={`/inventory/item/${item.id}`} 
                      className="text-[#fdc501] hover:text-yellow-600 font-medium text-sm inline-flex items-center"
                    >
                      View Details
                      <svg xmlns="http://www.w3.org/2000/svg" className="ml-1 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </Link>
                    <button className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
