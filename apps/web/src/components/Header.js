function Header({ brand, className = '', navigation, contactHref }) {
  return (
    <header className={`topbar ${className}`}>
      <a className="brand" href="/" aria-label="ZeroOne home">
        <img className="brand-tab-icon" src="/zeroone-tab-icon.svg" alt="" aria-hidden="true" />
        <div className="brand-copy">
          <strong>{brand.name}</strong>
        </div>
      </a>

      <nav className="nav" aria-label="Primary">
        {navigation.map((item) => (
          <a key={item.id} className="nav-link" href={item.href ?? `#${item.id}`} onClick={item.onClick}>
            {item.label}
          </a>
        ))}
      </nav>

      {contactHref ? (
        <a className="btn btn-outline" href={contactHref}>
          Contact Us
        </a>
      ) : null}
    </header>
  );
}

export default Header;
