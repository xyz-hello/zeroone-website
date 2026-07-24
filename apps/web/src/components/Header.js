function Header({ brand, navigation, contactHref }) {
  return (
    <header className="topbar">
      <a className="brand" href="/" aria-label="ZeroOne home">
        <div className="brand-copy">
          <strong>{brand.name}</strong>
        </div>
      </a>

      <nav className="nav" aria-label="Primary">
        {navigation.map((item) => (
          <a key={item.id} className="nav-link" href={item.href ?? `#${item.id}`}>
            {item.label}
          </a>
        ))}
      </nav>

      <a className="btn btn-outline" href={contactHref}>
        Contact Us
      </a>
    </header>
  );
}

export default Header;
