function Footer() {
  return (
    <footer className="bg-gray-100 border-t mt-auto">
      <div className="max-w-7xl mx-auto px-4 py-6 text-center text-gray-500 text-sm">
        Retail Catalog &copy; {new Date().getFullYear()}
      </div>
    </footer>
  );
}

export default Footer;