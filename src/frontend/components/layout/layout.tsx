import type {} from 'next';
import Header from './header/header';
import Sidebar from './sidebar/sidebar';

const Layout = ({ children }) => {
  return (
    <div className="flex flex-col h-full">
      <Header />
      <div className="flex flex-1">
        <Sidebar />
        <main className="flex-1">{children}</main>
      </div>
    </div>
  );
};

export default Layout;
