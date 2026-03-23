function Footer() {
  return (
    <footer className="mt-auto border-t border-slate-800 bg-slate-950 text-slate-300">
      <div className="max-w-7xl mx-auto px-4 py-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm">
          Stock Manager &copy; {new Date().getFullYear()}
        </p>
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium text-white">Built by Didac Odena</span>
          <a
            href="https://www.linkedin.com/in/didac-odena/"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center rounded-full bg-cyan-400 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-cyan-300 transition-colors"
          >
            Connect on LinkedIn
          </a>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
