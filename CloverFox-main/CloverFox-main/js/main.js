
document.addEventListener('DOMContentLoaded', () => {

  function trackEvent(eventName, data = {}) {
    console.log(`[Analytics] ${eventName}`, data);
    if (window.dataLayer) {
      window.dataLayer.push({ event: eventName, ...data });
    }
  }

  const header = document.querySelector('.site-header');
  if (header) {
    const scrollHandler = () => {
      header.classList.toggle('scrolled', window.scrollY > 50);
    };
    window.addEventListener('scroll', scrollHandler, { passive: true });
    scrollHandler();
  }

  const menuToggle = document.querySelector('.menu-toggle');
  const navMain = document.querySelector('.nav-main');
  if (menuToggle && navMain) {
    menuToggle.addEventListener('click', () => {
      menuToggle.classList.toggle('active');
      navMain.classList.toggle('open');
      document.body.style.overflow = navMain.classList.contains('open') ? 'hidden' : '';
    });

    navMain.querySelectorAll('.nav-link').forEach(link => {
      link.addEventListener('click', () => {
        menuToggle.classList.remove('active');
        navMain.classList.remove('open');
        document.body.style.overflow = '';
      });
    });
  }

  const animatedElements = document.querySelectorAll('.animate-on-scroll');
  if (animatedElements.length > 0) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry, index) => {
        if (entry.isIntersecting) {
          setTimeout(() => {
            entry.target.classList.add('visible');
          }, index * 100);
          observer.unobserve(entry.target);
        }
      });
    }, {
      threshold: 0.1,
      rootMargin: '0px 0px -50px 0px'
    });

    animatedElements.forEach(el => observer.observe(el));
  }

  function showToast(type, message) {
    let container = document.querySelector('.toast-container');
    if (!container) {
      container = document.createElement('div');
      container.className = 'toast-container';
      container.setAttribute('role', 'status');
      container.setAttribute('aria-live', 'polite');
      document.body.appendChild(container);
    }

    const icon = type === 'success' ? '✓' : type === 'info' ? 'ℹ' : '✕';
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `<span>${icon}</span><span>${message}</span>`;
    container.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateX(100px)';
      toast.style.transition = 'all 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  }
  window.showToast = showToast;

  function formatPrice(num) {
    return num.toFixed(2).replace('.', ',') + ' €';
  }

  const cart = {
    items: JSON.parse(localStorage.getItem('cloverfox_cart') || '[]'),

    add(product) {
      const existing = this.items.find(i => i.id === product.id);
      if (existing) {
        existing.quantity++;
      } else {
        this.items.push({ ...product, quantity: 1 });
      }
      this.save();
      this.updateUI();
      this.renderDrawer();
      showToast('success', `"${product.name}" añadido al carrito`);
    },

    remove(productId) {
      const item = this.items.find(i => i.id === productId);
      if (item) showToast('info', `"${item.name}" eliminado del carrito`);
      this.items = this.items.filter(i => i.id !== productId);
      this.save();
      this.updateUI();
      this.renderDrawer();
    },

    updateQuantity(productId, delta) {
      const item = this.items.find(i => i.id === productId);
      if (!item) return;
      item.quantity = Math.max(1, item.quantity + delta);
      this.save();
      this.updateUI();
      this.renderDrawer();
    },

    getTotal() {
      return this.items.reduce((s, i) => s + (i.price * i.quantity), 0);
    },

    getCount() {
      return this.items.reduce((s, i) => s + i.quantity, 0);
    },

    save() {
      localStorage.setItem('cloverfox_cart', JSON.stringify(this.items));
    },

    updateUI() {
      document.querySelectorAll('.cart-count').forEach(badge => {
        const count = this.getCount();
        badge.textContent = count;
        badge.style.display = count > 0 ? 'flex' : 'none';
      });
      const totalEl = document.querySelector('.cart-total-price');
      const subtotalEl = document.querySelector('.cart-subtotal-val');
      const ivaEl = document.querySelector('.cart-iva-val');
      const buyBtn = document.querySelector('.cart-drawer-footer .btn-buy');
      const headerCount = document.querySelector('.cart-header-count');

      if (totalEl) totalEl.textContent = formatPrice(this.getTotal());
      if (subtotalEl) subtotalEl.textContent = formatPrice(this.getTotal() / 1.21);
      if (ivaEl) ivaEl.textContent = formatPrice(this.getTotal() - (this.getTotal() / 1.21));
      if (buyBtn) buyBtn.disabled = this.items.length === 0;
      if (headerCount) headerCount.textContent = this.getCount();
    },

    renderDrawer() {
      const body = document.querySelector('.cart-drawer-body');
      if (!body) return;

      if (this.items.length === 0) {
        body.innerHTML = `
          <div class="cart-drawer-empty">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"
              stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <circle cx="9" cy="21" r="1" /><circle cx="20" cy="21" r="1" />
              <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
            </svg>
            <p><strong>Tu carrito está vacío</strong></p>
            <p>¡Añade juegos desde la tienda!</p>
          </div>`;
        return;
      }

      const favIds = favorites.items.map(f => f.id);

      body.innerHTML = this.items.map(item => {
        const isFav = favIds.includes(item.id);
        const imgClass = item.imgClass || '';
        return `
          <div class="cart-drawer-item" data-cart-item-id="${item.id}">
            <div class="cart-drawer-item-img placeholder-img ${imgClass}"
                 data-navigate-product="${item.id}"
                 title="Ver información de ${item.name}"
                 role="link" tabindex="0"></div>
            <div class="cart-drawer-item-info">
              <div class="cart-item-title"
                   data-navigate-product="${item.id}"
                   title="Ver información de ${item.name}"
                   role="link" tabindex="0">
                ${isFav ? '<span class="fav-indicator" aria-label="Favorito">❤</span>' : ''}
                <span>${item.name}</span>
              </div>
              <div class="cart-item-meta">
                <span class="cart-item-price">${formatPrice(item.price)}</span>
              </div>
              <div class="cart-qty-controls">
                <button data-qty-minus="${item.id}" aria-label="Reducir cantidad de ${item.name}">−</button>
                <span class="cart-qty-value">${item.quantity}</span>
                <button data-qty-plus="${item.id}" aria-label="Aumentar cantidad de ${item.name}">+</button>
              </div>
            </div>
            <button class="btn-remove-cart" data-remove-cart="${item.id}"
                    aria-label="Eliminar ${item.name} del carrito" title="Eliminar">&times;</button>
          </div>`;
      }).join('');

      body.querySelectorAll('[data-qty-minus]').forEach(btn => {
        btn.addEventListener('click', () => this.updateQuantity(btn.dataset.qtyMinus, -1));
      });
      body.querySelectorAll('[data-qty-plus]').forEach(btn => {
        btn.addEventListener('click', () => this.updateQuantity(btn.dataset.qtyPlus, 1));
      });
      body.querySelectorAll('[data-remove-cart]').forEach(btn => {
        btn.addEventListener('click', () => this.remove(btn.dataset.removeCart));
      });
      body.querySelectorAll('[data-navigate-product]').forEach(el => {
        const handler = () => {
          const id = el.dataset.navigateProduct;
          trackEvent('view_item', { item_id: id });
          window.location.href = `producto.html?id=${id}`;
        };
        el.addEventListener('click', handler);
        el.addEventListener('keydown', e => { if (e.key === 'Enter') handler(); });
      });
    }
  };

  function initCartDrawer() {
    let overlay = document.getElementById('cart-overlay');
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.id = 'cart-overlay';
      document.body.appendChild(overlay);
    }

    let drawer = document.getElementById('cart-drawer');
    if (!drawer) {
      drawer = document.createElement('div');
      drawer.id = 'cart-drawer';
      drawer.setAttribute('role', 'dialog');
      drawer.setAttribute('aria-modal', 'true');
      drawer.setAttribute('aria-label', 'Carrito de compras');
      drawer.innerHTML = `
        <div class="cart-drawer-header">
          <h2>🛒 Tu Carrito <span class="cart-header-count">${cart.getCount()}</span></h2>
          <button class="cart-drawer-close" aria-label="Cerrar carrito">&times;</button>
        </div>
        <div class="cart-drawer-body"></div>
        <div class="cart-drawer-footer">
          <div class="cart-subtotal-row">
            <span>Subtotal (sin IVA)</span>
            <span class="cart-subtotal-val">${formatPrice(cart.getTotal() / 1.21)}</span>
          </div>
          <div class="cart-subtotal-row">
            <span>IVA (21%)</span>
            <span class="cart-iva-val">${formatPrice(cart.getTotal() - (cart.getTotal() / 1.21))}</span>
          </div>
          <div class="cart-total-row">
            <span>Total</span>
            <span class="cart-total-price">${formatPrice(cart.getTotal())}</span>
          </div>
          <button class="btn-buy" aria-label="Comprar y pagar" ${cart.items.length === 0 ? 'disabled' : ''}>
            🔒 Comprar
          </button>
          <div class="cart-security">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor"
              stroke-width="2" aria-hidden="true">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
            Pago 100% seguro · SSL 256-bit
          </div>
        </div>`;
      document.body.appendChild(drawer);
    }

    const closeDrawer = () => {
      drawer.classList.remove('active');
      overlay.classList.remove('active');
      document.body.style.overflow = '';
    };

    const openDrawer = () => {
      drawer.classList.add('active');
      overlay.classList.add('active');
      document.body.style.overflow = 'hidden';
      cart.renderDrawer();
      cart.updateUI();
      trackEvent('cart_open', { item_count: cart.getCount(), total: cart.getTotal() });
      drawer.querySelector('.cart-drawer-close').focus();
    };

    drawer.querySelector('.cart-drawer-close').addEventListener('click', closeDrawer);
    overlay.addEventListener('click', closeDrawer);

    document.querySelectorAll('[data-open-cart]').forEach(btn => {
      btn.addEventListener('click', e => {
        e.preventDefault();
        openDrawer();
      });
    });

    drawer.querySelector('.btn-buy').addEventListener('click', () => {
      const btn = drawer.querySelector('.btn-buy');
      if (cart.items.length === 0) return;

      trackEvent('click_buy', { item_count: cart.getCount(), total: cart.getTotal() });

      btn.classList.add('loading');
      btn.innerHTML = 'Procesando… ';

      setTimeout(() => {
        trackEvent('checkout_started', { items: cart.items, total: cart.getTotal() });
        window.open('checkout.html', '_blank');
        btn.classList.remove('loading');
        btn.innerHTML = '🔒 Comprar';
        closeDrawer();
      }, 800);
    });

    document.addEventListener('keydown', e => {
      if (e.key === 'Escape' && drawer.classList.contains('active')) {
        closeDrawer();
      }
    });
  }


  document.querySelectorAll('[data-add-to-cart]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const card = btn.closest('.game-card, .merch-card, article');
      const placeholder = card?.querySelector('.placeholder-img');
      const imgClass = placeholder
        ? Array.from(placeholder.classList).find(c => c.startsWith('game-') || c.startsWith('merch-')) || ''
        : '';

      const titleEl = card?.querySelector('.game-card-title, .merch-card-title');
      const priceEl = card?.querySelector('.game-price, .merch-card-price');

      const product = {
        id: btn.dataset.productId,
        name: btn.dataset.productName || (titleEl ? titleEl.textContent : 'Producto'),
        price: btn.dataset.productPrice ? parseFloat(btn.dataset.productPrice) : parseFloat(priceEl?.textContent.replace(' €', '').replace(',', '.') || '0'),
        image: btn.dataset.productImage || '',
        imgClass: imgClass
      };
      cart.add(product);

      btn.classList.add('added');
      btn.textContent = '✓ Añadido';
      setTimeout(() => {
        btn.classList.remove('added');
        btn.textContent = btn.dataset.originalText || 'Comprar';
      }, 2000);
    });
  });

  const favorites = {
    items: JSON.parse(localStorage.getItem('cloverfox_favs') || '[]'),

    toggle(product) {
      const index = this.items.findIndex(i => i.id === product.id);
      if (index > -1) {
        this.items.splice(index, 1);
        showToast('info', `"${product.name}" eliminado de favoritos`);
      } else {
        this.items.push(product);
        showToast('success', `"${product.name}" añadido a favoritos`);
      }
      this.save();
      this.updateUI();
      cart.renderDrawer(); // refresh fav indicators in cart
    },

    remove(productId) {
      this.items = this.items.filter(i => i.id !== productId);
      this.save();
      this.updateUI();
      cart.renderDrawer();
    },

    save() {
      localStorage.setItem('cloverfox_favs', JSON.stringify(this.items));
    },

    updateUI() {
      document.querySelectorAll('.fav-count').forEach(badge => {
        const count = this.items.length;
        badge.textContent = count;
        badge.style.display = count > 0 ? 'flex' : 'none';
      });

      document.querySelectorAll('.btn-fav').forEach(btn => {
        const id = btn.dataset.productId;
        const isFav = this.items.some(i => i.id === id);
        btn.classList.toggle('active', isFav);
      });

      this.renderDrawer();

      // Sincronizar botón de la página de detalles
      const detailBtn = document.querySelector('.btn-fav-detail');
      if (detailBtn) {
        const detailId = detailBtn.dataset.productId;
        const isFav = this.items.some(i => i.id === detailId);
        detailBtn.classList.toggle('active', isFav);
        detailBtn.innerHTML = isFav ? '❤️ En favoritos' : '❤️ Favoritos';
      }
    },

    renderDrawer() {
      const container = document.querySelector('.fav-body');
      if (!container) return;

      if (this.items.length === 0) {
        container.innerHTML = `
          <div class="fav-empty">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" 
                 style="width: 48px; height: 48px; opacity: 0.2; margin-bottom: 10px;">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78L12 21.23l8.84-8.84a5.5 5.5 0 0 0 0-7.78z" />
            </svg>
            <p>No tienes juegos guardados todavía.</p>
            <p style="font-size: 0.8rem; margin-top: 5px; opacity: 0.7;">¡Añade algunos desde la tienda!</p>
          </div>`;
        return;
      }

      container.innerHTML = this.items.map(item => `
        <div class="fav-item" data-fav-id="${item.id}">
          <div class="fav-item-img placeholder-img ${item.class || ''}"></div>
          <div class="fav-item-info">
            <h4>${item.name}</h4>
            <span class="price">${item.price} €</span>
          </div>
          <div class="fav-item-actions">
            <button class="btn-remove-fav" data-remove-fav="${item.id}" title="Eliminar de favoritos">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
              </svg>
            </button>
          </div>
        </div>
      `).join('');

      container.querySelectorAll('[data-remove-fav]').forEach(btn => {
        btn.addEventListener('click', () => this.remove(btn.dataset.removeFav));
      });
    }
  };

  function initFavDrawer() {
    let drawer = document.querySelector('.fav-drawer');
    if (!drawer) {
      drawer = document.createElement('div');
      drawer.className = 'fav-drawer';
      drawer.id = 'fav-drawer';
      drawer.setAttribute('role', 'dialog');
      drawer.setAttribute('aria-modal', 'true');
      drawer.setAttribute('aria-label', 'Juegos guardados');
      drawer.innerHTML = `
        <div class="fav-header">
          <h2>❤️ Tus Guardados</h2>
          <button class="fav-close" aria-label="Cerrar">&times;</button>
        </div>
        <div class="fav-body"></div>`;
      document.body.appendChild(drawer);

      drawer.querySelector('.fav-close').addEventListener('click', () => {
        drawer.classList.remove('active');
      });
    }

    document.querySelectorAll('[data-open-fav]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        drawer.classList.add('active');
      });
    });

    document.addEventListener('click', (e) => {
      if (drawer.classList.contains('active') && !drawer.contains(e.target) && !e.target.closest('[data-open-fav]')) {
        drawer.classList.remove('active');
      }
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && drawer.classList.contains('active')) {
        drawer.classList.remove('active');
      }
    });
  }

  initFavDrawer();
  favorites.updateUI();

  initCartDrawer();
  cart.updateUI();
  cart.renderDrawer();

  document.addEventListener('click', (e) => {
    const btn = e.target.closest('.btn-fav');
    if (btn) {
      e.preventDefault();
      const card = btn.closest('.game-card, .merch-card, article');
      const placeholder = card?.querySelector('.placeholder-img');
      const titleEl = card?.querySelector('.game-card-title, .merch-card-title');
      const priceEl = card?.querySelector('.game-price, .merch-card-price');

      const product = {
        id: btn.dataset.productId,
        name: btn.dataset.productName || (titleEl ? titleEl.textContent : 'Producto'),
        price: priceEl ? priceEl.textContent.replace(' €', '').replace(',', '.') : '0',
        img: placeholder ? getComputedStyle(placeholder).backgroundImage.slice(5, -2).replace(/"/g, '') : '',
        class: placeholder ? (Array.from(placeholder.classList).find(c => c.startsWith('game-') || c.startsWith('merch-')) || '') : ''
      };
      favorites.toggle(product);
    }
  });

  const GAMES_DATA = {
    "game-001": {
      title: "Ecos del Abismo",
      price: "9,99 €",
      genre: "RPG",
      genreClass: "rpg",
      tags: ["RPG", "Aventura", "Pixel Art", "Un jugador"],
      desc: "Un RPG de acción en 2D donde exploras las ruinas de una civilización olvidada. Resuelve puzles, lucha contra criaturas arcanas y descifra los ecos del pasado.",
      longDesc: "Ecos del Abismo es un RPG de acción en 2D donde asumes el papel de Lyra, una exploradora que desciende a las ruinas de una civilización perdida bajo tierra. Cada nivel es un puzle arquitectónico que esconde fragmentos de una historia olvidada. <br><br> Combate fluido en tiempo real contra criaturas arcanas, recopila reliquias que potencian tus habilidades y descifra los ecos —fragmentos de memoria— que revelan qué le ocurrió a la antigua civilización del Abismo.",
      imgClass: "game-1"
    },
    "game-002": {
      title: "Latidos en la Niebla",
      price: "7,49 €",
      genre: "Terror",
      genreClass: "terror",
      tags: ["Terror", "Supervivencia", "Atmosférico", "Un jugador"],
      desc: "Un juego de terror psicológico y supervivencia. Atrapa tu linterna, contén la respiración y adéntrate en un bosque donde la niebla cobra vida propia.",
      longDesc: "Latidos en la Niebla te sumerge en un thriller psicológico ambientado en los bosques de Blackwood. Como un guardabosques atrapado en una niebla sobrenatural, deberás confiar en tus sentidos y en tu linterna para sobrevivir. <br><br> La niebla no es solo un obstáculo visual; reacciona a tus latidos y a tu miedo. Gestiona tu cordura mientras descubres el oscuro secreto que oculta el pueblo de Blackwood.",
      imgClass: "game-2"
    },
    "game-003": {
      title: "Reloj de Arena",
      price: "5,99 €",
      genre: "Puzzle",
      genreClass: "puzzle",
      tags: ["Puzzle", "Aventura", "Steampunk", "Estrategia"],
      desc: "Una aventura puzzle steampunk contra el tiempo. Manipula engranajes, invierte la gravedad y descubre los secretos de una torre relojera ancestral.",
      longDesc: "Reloj de Arena es un ingenioso juego de puzles mecánicos ambientado en una torre de reloj gigante que flota sobre las nubes. Manipula el tiempo para resolver acertijos que desafían la física. <br><br> Con una estética steampunk detallada y mecánicas innovadoras de manipulación temporal, cada piso de la torre ofrece un nuevo desafío que pondrá a prueba tu lógica y rapidez.",
      imgClass: "game-3"
    },
    "game-004": {
      title: "Crónicas de Aethelgard",
      price: "14,99 €",
      genre: "RPG",
      genreClass: "rpg",
      tags: ["RPG", "Táctico", "Fantasía", "Estrategia"],
      desc: "Un RPG táctico por turnos donde tus decisiones forjan el destino de un reino en decadencia.",
      longDesc: "Crónicas de Aethelgard es un RPG táctico profundo donde cada decisión política y militar tiene consecuencias reales. Dirige un pequeño grupo de héroes en un mundo al borde del colapso, gestiona recursos y forja alianzas para salvar —o condenar— el reino de Aethelgard.",
      imgClass: "game-4"
    },
    "game-005": {
      title: "Sombras del Destino",
      price: "12,50 €",
      genre: "RPG",
      genreClass: "rpg",
      tags: ["RPG", "Narrativo", "Magia", "Oscuro"],
      desc: "Adéntrate en una narrativa oscura y compleja donde la magia tiene un precio devastador.",
      longDesc: "En Sombras del Destino, la magia es una perdición. Explora un mundo sombrío donde cada hechizo consume parte de tu humanidad. Una historia ramificada con múltiples finales donde deberás elegir entre el poder y tu propia alma.",
      imgClass: "game-5"
    },
    "game-006": {
      title: "El Grito del Silencio",
      price: "8,99 €",
      genre: "Terror",
      genreClass: "terror",
      tags: ["Terror", "Puzle", "Psicológico", "Médico"],
      desc: "Explora los pasillos de un hospital psiquiátrico abandonado donde el silencio es tu único aliado.",
      longDesc: "El Grito del Silencio es una experiencia de terror puro en primera persona. Atrapado en el Hospital Psiquiátrico de Saint Jude, deberás resolver puzles ambientales y huir de una presencia que solo ataca cuando haces ruido.",
      imgClass: "game-6"
    },
    "game-007": {
      title: "Pesadilla en el Ártico",
      price: "10,99 €",
      genre: "Terror",
      genreClass: "terror",
      tags: ["Terror", "Supervivencia", "Frio", "Aventura"],
      desc: "Sobrevive al frío extremo y a una presencia acechante en una base científica aislada.",
      longDesc: "En Pesadilla en el Ártico, el frío es tan letal como las criaturas. Mantén tus generadores encendidos, gestiona tu escasa energía y descubre qué despertaron las excavaciones en la base científica Boreas.",
      imgClass: "game-7"
    },
    "game-008": {
      title: "Dimensiones Perdidas",
      price: "6,99 €",
      genre: "Puzzle",
      genreClass: "puzzle",
      tags: ["Puzzle", "Física", "Ciencia Ficción", "Estrategia"],
      desc: "Resuelve complejos acertijos alternando entre mundos paralelos con reglas físicas distintas.",
      longDesc: "Dimensiones Perdidas te permite saltar entre dos realidades coexistentes. Lo que es una pared en una dimensión, puede ser un puente en la otra. Un juego de lógica espacial que desafiará tu percepción de la realidad.",
      imgClass: "game-8"
    },
    "game-009": {
      title: "Mente de Cristal",
      price: "4,99 €",
      genre: "Puzzle",
      genreClass: "puzzle",
      tags: ["Puzzle", "Zen", "Lógica", "Minimalista"],
      desc: "Un viaje minimalista de lógica y reflexión con una banda sonora ambiental relajante.",
      longDesc: "Mente de Cristal es una experiencia de puzles abstractos diseñada para la relajación. Sin temporizadores ni presiones, solo tú y estructuras de cristal que debes alinear siguiendo patrones hermosos y lógicos.",
      imgClass: "game-9"
    },
    "game-010": {
      title: "El Tesoro de los Mares",
      price: "11,99 €",
      genre: "Aventura",
      genreClass: "aventura",
      tags: ["Aventura", "Piratas", "Mundo Abierto", "Acción"],
      desc: "Embárcate en una odisea pirata en busca del mítico tesoro de la Calavera de Oro.",
      longDesc: "Navega por el Mar de Coral en El Tesoro de los Mares. Personaliza tu barco, recluta una tripulación de marginados y combate contra flotas imperiales en esta aventura épica llena de ron, cañonazos y misterios antiguos.",
      imgClass: "game-10"
    },
    "game-011": {
      title: "Viaje al Centro de la Tierra",
      price: "13,49 €",
      genre: "Aventura",
      genreClass: "aventura",
      tags: ["Aventura", "Exploración", "Clásico", "Supervivencia"],
      desc: "Inspirado en la obra de Julio Verne, descubre biomas ocultos bajo la corteza terrestre.",
      longDesc: "Desciende a profundidades desconocidas en Viaje al Centro de la Tierra. Descubre dinosaurios que nunca se extinguieron, bosques de hongos gigantes y mares subterráneos en una de las mayores epopeyas de exploración jamás creadas.",
      imgClass: "game-11"
    },
    "game-012": {
      title: "Senda de Luces",
      price: "9,00 €",
      genre: "Aventura",
      genreClass: "aventura",
      tags: ["Aventura", "Fantasía", "Arte", "Narrativo"],
      desc: "Una fábula visual sobre la luz y la oscuridad en un bosque encantado artesanal.",
      longDesc: "Senda de Luces es un cuento de hadas interactivo. Guía a un espíritu de luz a través de un bosque consumido por la sombra. Utiliza el color y la luz para restaurar la naturaleza y devolver la vida a un mundo marchito.",
      imgClass: "game-12"
    },
    "game-013": {
      title: "Refugio Final",
      price: "7,99 €",
      genre: "Supervivencia",
      genreClass: "supervivencia",
      tags: ["Supervivencia", "Gestión", "Post-apocalíptico", "Estrategia"],
      desc: "Gestiona recursos y personal en un búnker subterráneo tras el fin del mundo.",
      longDesc: "En Refugio Final, eres el supervisor de un búnker tras un cataclismo nuclear. Toma decisiones difíciles sobre quién come, quién trabaja y si debes abrir la puerta a los desesperados del exterior.",
      imgClass: "game-13"
    },
    "game-014": {
      title: "Náufrago Estelar",
      price: "15,99 €",
      genre: "Supervivencia",
      genreClass: "supervivencia",
      tags: ["Supervivencia", "Espacio", "Construcción", "Acción"],
      desc: "Sobrevive en un planeta alienígena hostil recolectando materiales y construyendo tu base.",
      longDesc: "Atrapado en el planeta Kepler-186f, Náufrago Estelar te obliga a domar un ecosistema extraño. Construye refugios herméticos, cultiva plantas alienígenas y repara tu nave mientras te defiendes de depredadores nocturnos.",
      imgClass: "game-14"
    },
    "game-015": {
      title: "El Bosque Hambriento",
      price: "6,50 €",
      genre: "Supervivencia",
      genreClass: "supervivencia",
      tags: ["Supervivencia", "Naturaleza", "Difícil", "Estrategia"],
      desc: "Supervivencia táctica pura contra la naturaleza y la escasez en un bosque boreal implacable.",
      longDesc: "El Bosque Hambriento es un desafío de supervivencia invernal. Sin monstruos ni zombis, solo el hambre, el frío y la soledad. ¿Cuánto tiempo lograrás sobrevivir en el corazón de la tundra con solo un hacha y tu ingenio?",
      imgClass: "game-15"
    }
  };


  document.querySelectorAll('.game-card').forEach(card => {
    card.style.cursor = 'pointer';
    card.addEventListener('click', (e) => {
      if (e.target.closest('button, a, .btn-fav, .game-actions')) return;
      const id = card.dataset.id;
      if (id) {
        window.location.href = `producto.html?id=${id}`;
      } else {
        window.location.href = 'producto.html';
      }
    });
  });

  const productPage = document.querySelector('.product-info');
  if (productPage) {
    const urlParams = new URLSearchParams(window.location.search);
    const productId = urlParams.get('id') || 'game-001';
    const game = GAMES_DATA[productId];

    if (game) {
      document.title = `${game.title} — CLOVERFOX Studios`;
      productPage.querySelector('h1').textContent = game.title;
      productPage.querySelector('.product-price').textContent = game.price;
      productPage.querySelector('.product-description').innerHTML = `<p>${game.longDesc}</p>`;

      const tagsContainer = productPage.querySelector('.product-tags');
      if (tagsContainer) {
        tagsContainer.innerHTML = game.tags.map(tag => `
          <span class="genre-tag ${tag.toLowerCase() === game.genre.toLowerCase() ? game.genreClass : ''}" 
                style="${tag.toLowerCase() !== game.genre.toLowerCase() ? 'background: rgba(255,255,255,0.1); color: var(--color-text-secondary);' : ''}">
            ${tag}
          </span>
        `).join('');
      }

      // Configurar galería de imágenes dinámica según la convención [Título]_X.png en carpeta assets
      const mainImg = document.querySelector('.product-gallery-main .placeholder-img');
      if (mainImg) {
        const mainImgPath = `assets/${game.title}_1.png`;
        const img = new Image();
        img.onload = () => {
          mainImg.style.backgroundImage = `url("${encodeURI(mainImgPath)}")`;
          mainImg.innerHTML = '';
        };
        img.src = encodeURI(mainImgPath);
      }

      const thumbsContainer = document.querySelector('.product-gallery-thumbs');
      if (thumbsContainer) {
        thumbsContainer.innerHTML = ''; // Limpiar miniaturas
        let imgIndex = 1;

        const loadNextImage = () => {
          const imgPath = `assets/${game.title}_${imgIndex}.png`;
          const testImg = new Image();

          testImg.onload = () => {
            const thumbBtn = document.createElement('button');
            thumbBtn.className = `thumb ${imgIndex === 1 ? 'active' : ''}`;
            thumbBtn.setAttribute('aria-label', `Ver imagen ${imgIndex}`);

            const thumbDiv = document.createElement('div');
            thumbDiv.className = 'placeholder-img';
            thumbDiv.style.width = '100%';
            thumbDiv.style.height = '100%';
            thumbDiv.style.backgroundImage = `url("${encodeURI(imgPath)}")`;

            thumbBtn.appendChild(thumbDiv);
            thumbsContainer.appendChild(thumbBtn);

            thumbBtn.addEventListener('click', () => {
              thumbsContainer.querySelectorAll('.thumb').forEach(t => t.classList.remove('active'));
              thumbBtn.classList.add('active');
              if (mainImg) {
                mainImg.style.backgroundImage = `url("${encodeURI(imgPath)}")`;
              }
            });

            imgIndex++;
            loadNextImage();
          };

          testImg.onerror = () => {
            // No more images found
          };

          testImg.src = encodeURI(imgPath);
        };
        loadNextImage();
      }

      const breadcrumbCurrent = document.querySelector('nav[aria-label="Migas de pan"] span:last-child');
      if (breadcrumbCurrent) {
        breadcrumbCurrent.textContent = game.title;
      }

      const buyBtn = productPage.querySelector('[data-add-to-cart]');
      if (buyBtn) {
        buyBtn.dataset.productId = productId;
        buyBtn.dataset.productName = game.title;
        buyBtn.dataset.productPrice = game.price.replace(' €', '').replace(',', '.');
        buyBtn.innerHTML = `🛒 Añadir al carrito`;
      }

      const favBtn = productPage.querySelector('.btn-fav-detail');
      if (favBtn) {
        favBtn.dataset.productId = productId;
        favBtn.addEventListener('click', () => {
          const product = {
            id: productId,
            name: game.title,
            price: game.price.replace(' €', '').replace(',', '.'),
            class: game.imgClass,
            img: placeholder ? getComputedStyle(placeholder).backgroundImage.slice(5, -2).replace(/"/g, '') : `assets/portadas/1/${game.title}_1.png`
          };
          favorites.toggle(product);
        });
      }
    }
  }

  document.querySelectorAll('[data-modal-open]').forEach(trigger => {
    trigger.addEventListener('click', (e) => {
      e.preventDefault();
      const modal = document.getElementById(trigger.dataset.modalOpen);
      if (modal) {
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
        const firstInput = modal.querySelector('input, textarea, select');
        if (firstInput) firstInput.focus();
      }
    });
  });

  document.querySelectorAll('.modal-close, .modal-backdrop').forEach(el => {
    el.addEventListener('click', (e) => {
      if (e.target === el) {
        const backdrop = el.closest('.modal-backdrop') || el;
        backdrop.classList.remove('active');
        document.body.style.overflow = '';
      }
    });
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      document.querySelectorAll('.modal-backdrop.active').forEach(modal => {
        modal.classList.remove('active');
        document.body.style.overflow = '';
      });
    }
  });

  const searchForm = document.querySelector('.hero-search');
  if (searchForm) {
    const searchInput = searchForm.querySelector('input');
    const searchBtn = searchForm.querySelector('.btn');

    const performSearch = () => {
      const query = searchInput.value.trim().toLowerCase();
      if (!query) return;

      const gameCards = document.querySelectorAll('.game-card');
      let found = 0;

      gameCards.forEach(card => {
        const title = card.querySelector('.game-card-title')?.textContent.toLowerCase() || '';
        const genre = card.querySelector('.genre-tag')?.textContent.toLowerCase() || '';
        const desc = card.querySelector('.game-card-desc')?.textContent.toLowerCase() || '';

        const matches = title.includes(query) || genre.includes(query) || desc.includes(query);
        card.style.display = matches ? '' : 'none';
        if (matches) found++;
      });

      showToast('success', `Se encontraron ${found} resultado(s) para "${query}"`);
    };

    if (searchBtn) {
      searchBtn.addEventListener('click', (e) => { e.preventDefault(); performSearch(); });
    }
    searchInput?.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') { e.preventDefault(); performSearch(); }
    });
  }

  const filterBtns = document.querySelectorAll('.filter-btn');
  if (filterBtns.length > 0) {
    filterBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        filterBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const filter = btn.dataset.filter;
        document.querySelectorAll('.game-card').forEach(card => {
          if (filter === 'all') {
            card.style.display = '';
          } else {
            const genre = card.querySelector('.genre-tag')?.textContent.toLowerCase().trim();
            card.style.display = genre === filter ? '' : 'none';
          }
        });
      });
    });
  }

  document.querySelectorAll('form[data-ajax]').forEach(form => {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      let valid = true;
      form.querySelectorAll('[required]').forEach(field => {
        if (!field.value.trim()) {
          valid = false;
          field.style.borderColor = '#E74C3C';
          field.addEventListener('input', () => { field.style.borderColor = ''; }, { once: true });
        }
      });
      if (!valid) {
        showToast('error', 'Por favor, completa todos los campos obligatorios.');
        return;
      }
      const submitBtn = form.querySelector('[type="submit"]');
      const originalText = submitBtn?.textContent;
      if (submitBtn) { submitBtn.textContent = 'Enviando...'; submitBtn.disabled = true; }
      setTimeout(() => {
        showToast('success', '¡Mensaje enviado con éxito! Te responderemos pronto.');
        form.reset();
        if (submitBtn) { submitBtn.textContent = originalText; submitBtn.disabled = false; }
        const modal = form.closest('.modal-backdrop');
        if (modal) { modal.classList.remove('active'); document.body.style.overflow = ''; }
      }, 1500);
    });
  });

  document.querySelectorAll('.newsletter-form').forEach(form => {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const input = form.querySelector('input[type="email"]');
      if (input && input.value.trim()) {
        showToast('success', '¡Gracias por suscribirte a nuestro newsletter!');
        input.value = '';
      } else {
        showToast('error', 'Por favor, introduce un email válido.');
      }
    });
  });

  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', (e) => {
      const targetId = anchor.getAttribute('href');
      if (targetId === '#') return;
      const target = document.querySelector(targetId);
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });

  const loginForm = document.querySelector('#loginForm');
  if (loginForm) {
    loginForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const email = loginForm.querySelector('#loginEmail')?.value;
      const password = loginForm.querySelector('#loginPassword')?.value;
      if (email && password) {
        showToast('success', '¡Bienvenido/a de nuevo! Redirigiendo...');
        setTimeout(() => { window.location.href = 'index.html'; }, 1500);
      }
    });
  }



  const currentPage = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-link').forEach(link => {
    const href = link.getAttribute('href');
    if (href === currentPage || (currentPage === '' && href === 'index.html')) {
      link.classList.add('active');
    }
  });

  if ('IntersectionObserver' in window) {
    const imgObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const img = entry.target;
          if (img.dataset.src) {
            img.src = img.dataset.src;
            img.removeAttribute('data-src');
          }
          imgObserver.unobserve(img);
        }
      });
    });
    document.querySelectorAll('img[data-src]').forEach(img => imgObserver.observe(img));
  }

  console.log('%c🦊 CLOVERFOX Studios', 'font-size: 20px; font-weight: bold; color: #FF6B2B;');
  console.log('%cSitio web cargado correctamente.', 'color: #2ECC71;');
});


