import type {} from 'next';
import {} from 'react';
import Link from 'next/link';

const Sidebar = () => {
  return (
    <div className="md:min-w-250 mx-auto px-2 sm:px-6 lg:px-8 bg-gray-100 hidden sm:block">
      {/* Navigation */}
      <ul className="md:flex-col md:min-w-full flex flex-col list-none">
        <li className="items-center">
          <Link href="/">
            <a className="text-pink-500 hover:text-pink-600 text-xs uppercase py-3 font-bold block">
              <i className="fas fa-tv opacity-75 mr-2 text-sm"></i> Fine Tuning
              DataSet
            </a>
          </Link>
        </li>

        {/* <li className="items-center">
          <Link href="/">
            <a className="text-gray-700 hover:text-blueGray-500 text-xs uppercase py-3 font-bold block">
              <i className="fas fa-newspaper text-blueGray-400 mr-2 text-sm"></i>{' '}
              Landing Page
            </a>
          </Link>
        </li>

        <li className="items-center">
          <Link href="/">
            <a className="text-gray-700 hover:text-blueGray-500 text-xs uppercase py-3 font-bold block">
              <i className="fas fa-user-circle text-blueGray-400 mr-2 text-sm"></i>{' '}
              Profile Page
            </a>
          </Link>
        </li>

        <li className="items-center">
          <Link href="/">
            <a className="text-gray-700 hover:text-blueGray-500 text-xs uppercase py-3 font-bold block">
              <i className="fas fa-fingerprint text-blueGray-400 mr-2 text-sm"></i>{' '}
              Login
            </a>
          </Link>
        </li>

        <li className="items-center">
          <a
            className="text-gray-300 text-xs uppercase py-3 font-bold block"
            href="#pablo"
            onClick={(e) => e.preventDefault()}
          >
            <i className="fas fa-clipboard-list text-gray-300 mr-2 text-sm"></i>{' '}
            Register (soon)
          </a>
        </li>

        <li className="items-center">
          <a
            className="text-gray-300 text-xs uppercase py-3 font-bold block"
            href="#pablo"
            onClick={(e) => e.preventDefault()}
          >
            <i className="fas fa-tools text-gray-300 mr-2 text-sm"></i> Settings
            (soon)
          </a>
        </li> */}
      </ul>
    </div>
  );
};

export default Sidebar;
