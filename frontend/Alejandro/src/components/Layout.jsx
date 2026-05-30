import Navbar from './Navbar';

export default function Layout({ children }) {
  return (
    <div className="app-shell">
      <Navbar />
      <div className="app-main">{children}</div>
    </div>
  );
}
