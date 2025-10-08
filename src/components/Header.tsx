import React, { useState } from 'react';
import { 
  Calculator, 
  Home, 
  GitBranch, 
  Grid3X3, 
  Infinity, 
  Network,
  Search,
  Bell,
  ChevronDown,
  Menu,
  X
} from 'lucide-react';

const Header = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navigationItems = [
    { icon: Home, label: 'Dashboard', active: true },
    { icon: GitBranch, label: 'Graph Theory', active: false },
    { icon: Grid3X3, label: 'Linear Algebra', active: false },
    { icon: Infinity, label: 'Combinatorics', active: false },
    { icon: Network, label: 'Set Theory', active: false },
  ];

  return (
    <header className="bg-neutral-900 text-white shadow-lg">
      <div className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Logo and Navigation */}
          <div className="flex items-center space-x-8">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-neutral-700 rounded-lg flex items-center justify-center">
                <Calculator className="text-white text-xl" />
              </div>
              <h1 className="text-2xl font-bold">DMath</h1>
            </div>
            
            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center space-x-6">
              {navigationItems.map((item, index) => (
                <button
                  key={index}
                  className={`flex items-center space-x-2 transition-colors ${
                    item.active 
                      ? 'text-white' 
                      : 'text-neutral-300 hover:text-white'
                  }`}
                >
                  <item.icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </button>
              ))}
            </nav>
          </div>

          {/* Right Section */}
          <div className="flex items-center space-x-4">
            {/* Search */}
            <div className="relative hidden md:block">
              <input
                type="text"
                placeholder="Search problems..."
                className="bg-neutral-800 text-white px-4 py-2 rounded-lg w-64 focus:outline-none focus:ring-2 focus:ring-neutral-600"
              />
              <Search className="absolute right-3 top-2.5 w-4 h-4 text-neutral-400" />
            </div>
            
            {/* Notifications */}
            <button className="bg-neutral-800 hover:bg-neutral-700 p-2 rounded-lg transition-colors">
              <Bell className="w-5 h-5" />
            </button>
            
            {/* User Menu */}
            <div className="flex items-center space-x-3">
              <img 
                src="https://api.dicebear.com/7.x/notionists/svg?scale=200&seed=1234" 
                alt="User Avatar" 
                className="w-8 h-8 rounded-full"
              />
              <span className="hidden md:block">Alex Chen</span>
              <ChevronDown className="w-4 h-4" />
            </div>

            {/* Mobile Menu Button */}
            <button
              className="md:hidden"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden mt-4 pb-4 border-t border-neutral-800 pt-4">
            <nav className="space-y-4">
              {navigationItems.map((item, index) => (
                <button
                  key={index}
                  className={`flex items-center space-x-2 w-full text-left ${
                    item.active 
                      ? 'text-white' 
                      : 'text-neutral-300 hover:text-white'
                  }`}
                >
                  <item.icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </button>
              ))}
            </nav>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;