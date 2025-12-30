/*
 * Copyright (c) 2025 LocalGearbox. All rights reserved.
 * Licensed under the MIT License. See LICENSE file in the project root for details.
 */

export default function Footer() {
  return (
    <footer className="w-full bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 py-6 mt-8 text-center text-sm text-gray-500 dark:text-gray-400">
      <div className="max-w-7xl mx-auto px-4">
        <span>
          &copy; {new Date().getFullYear()} LocalGearbox. All rights reserved. | Built for backend
          engineers.
        </span>
      </div>
    </footer>
  );
}
