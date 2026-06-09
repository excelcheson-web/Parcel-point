export type Language = 'EN' | 'ES' | 'FR' | 'DE' | 'CN' | 'AR' | 'PT' | 'IT' | 'NL';

// Export LanguageCode as alias for backward compatibility
export type LanguageCode = Language;

// Language metadata for UI display
export const languages = [
  { code: 'EN' as LanguageCode, name: 'English', flag: '🇬🇧', dir: 'ltr' },
  { code: 'ES' as LanguageCode, name: 'Español', flag: '🇪🇸', dir: 'ltr' },
  { code: 'FR' as LanguageCode, name: 'Français', flag: '🇫🇷', dir: 'ltr' },
  { code: 'DE' as LanguageCode, name: 'Deutsch', flag: '🇩🇪', dir: 'ltr' },
  { code: 'CN' as LanguageCode, name: '中文', flag: '🇨🇳', dir: 'ltr' },
  { code: 'AR' as LanguageCode, name: 'العربية', flag: '🇸🇦', dir: 'rtl' },
  { code: 'PT' as LanguageCode, name: 'Português', flag: '🇵🇹', dir: 'ltr' },
  { code: 'IT' as LanguageCode, name: 'Italiano', flag: '🇮🇹', dir: 'ltr' },
  { code: 'NL' as LanguageCode, name: 'Nederlands', flag: '🇳🇱', dir: 'ltr' }
];

// Export Translations type for useTranslation hook
export type Translations = typeof translations.EN;

export const translations = {
  EN: {
    // Navigation
    nav: {
      home: 'Home',
      about: 'About Us',
      services: 'Services',
      track: 'Track Parcel',
      contact: 'Contact',
      staff: 'Staff Portal',
      chat: 'Live Chat',
      faqs: 'FAQs',
      terms: 'Terms',
      privacy: 'Privacy',
      cookies: 'Cookies'
    },
    // Hero Section
    hero: {
      title1: 'Global Logistics',
      title2: 'Made Simple',
      description: 'Connecting businesses and individuals to a smarter global shipping network — with end-to-end visibility, dependable delivery, and world-class service at every step.',
      trackingLabel: 'Enter your waybill or tracking number',
      placeholder: 'e.g., PP-AWB-1234-2026',
      trackButton: 'Track Shipment',
      example: 'e.g. PP-AWB-1234-2026 · PP-SWB-8765-2026 · PP-AWB-ABCD-2026',
      liveTracking: 'Live Tracking Active'
    },
    // Identity Section
    identity: {
      title: 'Who We Are',
      subtitle: 'Built on purpose. Guided by principle. Delivering excellence across every border.',
      mission: {
        title: 'Our Mission',
        text: 'At Parcel Point, our mission is to make global shipping simple, transparent, and reliable for businesses and individuals. We are committed to connecting people, products, and opportunities through innovative logistics solutions that provide real-time visibility, dependable delivery, and exceptional customer service. Every shipment entrusted to us is handled with care, precision, and accountability.'
      },
      vision: {
        title: 'Our Vision',
        text: 'Our vision is to become a trusted global leader in logistics and parcel delivery by transforming the way shipments move across borders. We aim to build a smarter and more connected logistics network that empowers businesses to grow, supports international trade, and gives customers complete confidence in every delivery journey.'
      },
      values: {
        title: 'Core Values',
        customerFirst: 'Customer First: Our customers are at the center of everything we do. We listen, respond, and work tirelessly to deliver solutions that exceed expectations.',
        reliability: 'Reliability: Trust is earned through consistency. We are dedicated to providing dependable services that customers can count on every time.',
        transparency: 'Transparency: We believe in open communication and complete visibility. From shipment tracking to customer support, we keep our customers informed every step of the way.',
        innovation: 'Innovation: We continuously embrace technology and new ideas to improve efficiency, enhance customer experiences, and stay ahead in a rapidly evolving industry.',
        integrity: 'Integrity: We conduct our business with honesty, accountability, and professionalism, building long-term relationships based on trust and respect.',
        excellence: 'Excellence: We strive for excellence in every aspect of our operations, from customer service to delivery performance, ensuring the highest standards across our network.',
        globalConnection: 'Global Connection: We are passionate about connecting people and businesses around the world, creating opportunities through seamless logistics and international reach.'
      }
    },
    // Services Section
    services: {
      title: 'Our Services',
      subtitle: 'From express air freight to last-mile delivery — purpose-built solutions for every shipping challenge.',
      viewAll: 'View All Services',
      air: {
        title: 'Air Freight',
        shortDesc: 'Speed Without Compromise',
        desc: 'When time is your most valuable asset, our Air Freight solutions deliver. We leverage a global network of premium air carriers to ensure your high-priority cargo reaches any destination worldwide in record time.'
      },
      ocean: {
        title: 'Ocean Freight',
        shortDesc: 'Global Reach, Scalable Solutions',
        desc: 'For large-scale international trade, our Ocean Freight service offers the perfect balance of cost-efficiency and reliability. Whether you require FCL or LCL, we provide secure transit across all major sea lanes.'
      },
      warehouse: {
        title: 'Warehousing',
        shortDesc: 'Smart Storage & Inventory Control',
        desc: 'Our state-of-the-art warehousing facilities are strategic hubs for your supply chain. Featuring climate-controlled environments and advanced Inventory Management Systems.'
      },
      ground: {
        title: 'Ground Transport',
        shortDesc: 'Last Mile Excellence',
        desc: 'Our Ground Transport network provides the critical last-mile connection, ensuring your goods move seamlessly from ports and airports to their final destination.'
      }
    },
    // Priorities Section
    priorities: {
      title: 'Our Core Values',
      subtitle: 'The principles that define how we operate and how we serve every customer, every day.',
      customer: { title: 'Customer First', desc: 'Our customers are at the center of everything we do.' },
      innovation: { title: 'Innovation', desc: 'We embrace technology and new ideas to improve efficiency.' },
      sustainability: { title: 'Reliability', desc: 'Trust is earned through consistency and dependable service.' },
      connectivity: { title: 'Global Connection', desc: 'Connecting people and businesses around the world.' }
    },
    // Testimonials Section
    testimonials: {
      title: 'What Our Clients Say',
      subtitle: 'Hear from the businesses that trust us with their most important shipments.'
    },
    // CTA Section
    cta: {
      title: 'Move What Matters. Trust Parcel Point.',
      subtitle: 'Join thousands of businesses that rely on Parcel Point for consistent, transparent global delivery — on time, every time.',
      learnMore: 'About Us',
      contactSales: 'Get in Touch',
      contactTeam: 'Contact Team',
      backToHome: 'Back to Home',
      customSolution: 'Need a Custom Solution?',
      customSolutionDesc: 'Our logistics experts are ready to tailor a solution for your unique needs.'
    },
    // Footer
    footer: {
      companyDesc: 'Your trusted global partner for intelligent logistics — real-time shipment tracking, reliable delivery, and exceptional service across 200+ countries.',
      quickLinks: 'Quick Links',
      support: 'Support',
      legal: 'Legal',
      contact: 'Contact',
      staff: 'Staff',
      about: 'About Us',
      services: 'Services',
      trackParcel: 'Track Parcel',
      getQuote: 'Get Quote',
      helpCenter: 'Help Center',
      contactUs: 'Contact Us',
      faqs: 'FAQs',
      liveChat: 'Live Chat',
      terms: 'Terms',
      privacy: 'Privacy',
      cookies: 'Cookies',
      staffPortal: 'Staff Portal',
      rights: '© 2026 Parcel Point. All rights reserved.',
      followUs: 'Follow us:'
    },
    // Common
    common: {
      learnMore: 'Learn More',
      getStarted: 'Get Started',
      contactUs: 'Contact Us',
      loading: 'Loading...',
      error: 'An error occurred',
      success: 'Success!',
      close: 'Close',
      submit: 'Submit',
      cancel: 'Cancel',
      save: 'Save',
      delete: 'Delete',
      edit: 'Edit',
      view: 'View',
      download: 'Download',
      print: 'Print',
      search: 'Search',
      filter: 'Filter',
      sort: 'Sort',
      next: 'Next',
      previous: 'Previous',
      back: 'Back',
      continue: 'Continue',
      finish: 'Finish',
      confirm: 'Confirm',
      yes: 'Yes',
      no: 'No',
      ok: 'OK',
      welcome: 'Welcome',
      hello: 'Hello',
      goodbye: 'Goodbye',
      thankYou: 'Thank you',
      please: 'Please',
      sorry: 'Sorry',
      congratulations: 'Congratulations',
      welcomeBack: 'Welcome back',
      goodMorning: 'Good morning',
      goodAfternoon: 'Good afternoon',
      goodEvening: 'Good evening',
      goodNight: 'Good night'
    }
  },
  
  // Spanish (ES) - Complete translations
  ES: {
    nav: {
      home: 'Inicio',
      about: 'Sobre Nosotros',
      services: 'Servicios',
      track: 'Rastrear Paquete',
      contact: 'Contacto',
      staff: 'Portal de Personal',
      chat: 'Chat en Vivo',
      faqs: 'Preguntas Frecuentes',
      terms: 'Términos',
      privacy: 'Privacidad',
      cookies: 'Cookies'
    },
    hero: {
      title1: 'Logística Global',
      title2: 'Simplificada',
      description: 'Rastree sus envíos en tiempo real con nuestra avanzada plataforma logística. Servicios de entrega rápidos, confiables y transparentes en todo el mundo.',
      trackingLabel: 'Ingrese su número de rastreo',
      placeholder: 'ej., PP-AWB-1234-2026',
      trackButton: 'Rastrear',
      example: 'Ejemplo: PP-AWB-1234-2026, PP-SWB-8765-2026, PP-DTD-ABCD-2026, o PP-TEST-9999',
      liveTracking: 'Rastreo en Vivo Activo'
    },
    identity: {
      title: 'Quiénes Somos',
      subtitle: 'Los principios que guían nuestro viaje en la revolución de la logística global',
      mission: {
        title: 'Nuestra Misión',
        text: 'En Parcel Point, nuestra misión es hacer que el envío global sea simple, transparente y confiable para empresas e individuos. Estamos comprometidos a conectar personas, productos y oportunidades a través de soluciones logísticas innovadoras que brindan visibilidad en tiempo real, entrega confiable y servicio al cliente excepcional.'
      },
      vision: {
        title: 'Nuestra Visión',
        text: 'Nuestra visión es convertirnos en un líder global de confianza en logística y entrega de paquetes, transformando la forma en que los envíos se mueven a través de las fronteras. Buscamos construir una red logística más inteligente y conectada que empodere a las empresas a crecer.'
      },
      values: {
        title: 'Valores Fundamentales',
        customerFirst: 'Cliente Primero: Nuestros clientes están en el centro de todo lo que hacemos.',
        reliability: 'Confiabilidad: La confianza se gana con consistencia y servicio dependable.',
        transparency: 'Transparencia: Creemos en la comunicación abierta y la visibilidad completa.',
        innovation: 'Innovación: Adoptamos tecnología y nuevas ideas para mejorar la eficiencia.',
        integrity: 'Integridad: Hacemos negocios con honestidad, responsabilidad y profesionalismo.',
        excellence: 'Excelencia: Nos esforzamos por la excelencia en cada aspecto de nuestras operaciones.',
        globalConnection: 'Conexión Global: Conectamos personas y empresas en todo el mundo.'
      }
    },
    services: {
      title: 'Nuestros Servicios',
      subtitle: 'Soluciones logísticas integrales adaptadas a sus necesidades',
      viewAll: 'Ver Todos los Servicios',
      air: { title: 'Carga Aérea', shortDesc: 'Velocidad Sin Compromiso', desc: 'Soluciones de carga aérea premium.' },
      ocean: { title: 'Carga Marítima', shortDesc: 'Alcance Global', desc: 'Servicio marítimo confiable.' },
      warehouse: { title: 'Almacenamiento', shortDesc: 'Almacenamiento Inteligente', desc: 'Instalaciones de última generación.' },
      ground: { title: 'Transporte Terrestre', shortDesc: 'Precisión', desc: 'Red de transporte terrestre.' }
    },
    priorities: {
      title: 'Nuestras Prioridades', subtitle: 'Valores fundamentales',
      customer: { title: 'Centricidad', desc: 'Entregamos tranquilidad.' },
      innovation: { title: 'Innovación', desc: 'IA y rastreo digital.' },
      sustainability: { title: 'Sostenibilidad', desc: 'Futuro más verde.' },
      connectivity: { title: 'Conectividad', desc: 'Mercados globales.' }
    },
    testimonials: { title: 'Opiniones de Clientes', subtitle: 'Empresas confían en nosotros' },
    cta: {
      title: '¿Listo para Enviar?', subtitle: 'Únase a miles de empresas.', learnMore: 'Conozca Más', contactSales: 'Contactar Ventas',
      contactTeam: 'Contactar Equipo', backToHome: 'Volver al Inicio', customSolution: '¿Solución Personalizada?', customSolutionDesc: 'Expertos en logística a su medida.'
    },
    footer: {
      companyDesc: 'Su socio de confianza en logística global.', quickLinks: 'Enlaces', support: 'Soporte', legal: 'Legal', staff: 'Personal',
      about: 'Nosotros', services: 'Servicios', trackParcel: 'Rastrear', getQuote: 'Cotización', helpCenter: 'Ayuda', contactUs: 'Contáctenos',
      faqs: 'FAQ', liveChat: 'Chat', terms: 'Términos', privacy: 'Privacidad', cookies: 'Cookies', staffPortal: 'Portal Personal',
      rights: '© 2026 Parcel Point. Todos los derechos reservados.'
    },
    about: {
      title: 'Acerca de PARCEL POINT', visionTitle: 'Nuestra Visión', visionText: 'Enfoque de caja de cristal.',
      whoWeAreTitle: 'Quiénes Somos', whoWeAreText: 'Fundados en precisión y velocidad.',
      whyChooseTitle: '¿Por Qué Elegirnos?', precision: 'Precisión', global: 'Alcance Global', adaptive: 'Adaptabilidad', security: 'Seguridad'
    },
    contact: {
      title: 'Contáctenos', subtitle: 'Envíenos un mensaje', name: 'Nombre', email: 'Correo', phone: 'Teléfono', subject: 'Asunto', message: 'Mensaje',
      send: 'Enviar', sending: 'Enviando...', successTitle: '¡Mensaje Enviado!', successText: 'Responderemos pronto.'
    },
    track: {
      title: 'Rastree Su Envío', enterId: 'Ingrese ID', trackButton: 'Rastrear', trackingId: 'ID', status: 'Estado',
      origin: 'Origen', destination: 'Destino', estimatedDelivery: 'Entrega Estimada', progress: 'Progreso', history: 'Historial',
      backToHome: 'Volver', tryAgain: 'Reintentar', invalidId: 'ID inválido'
    },
    common: { loading: 'Cargando...', error: 'Error', retry: 'Reintentar', close: 'Cerrar', save: 'Guardar', cancel: 'Cancelar', submit: 'Enviar' }
  },
  FR: {
    nav: { home: 'Accueil', about: 'À Propos', services: 'Services', track: 'Suivre', contact: 'Contact', staff: 'Portail Personnel' },
    hero: {
      title1: 'Logistique Mondiale', title2: 'Simplifiée',
      description: 'Suivez vos expéditions en temps réel. Services rapides et fiables.',
      trackingLabel: 'Numéro de suivi', placeholder: 'ex., PP-AWB-1234-2026', trackButton: 'Suivre',
      example: 'Exemple: PP-AWB-1234-2026', liveTracking: 'Suivi en Direct'
    },
    identity: {
      title: 'Qui Nous Sommes', subtitle: 'Principes qui guident notre révolution logistique',
      mission: { title: 'Notre Mission', text: 'Fournir le réseau logistique le plus transparent.' },
      vision: { title: 'Notre Vision', text: 'Définir l\'avenir du commerce mondial.' },
      values: { title: 'Valeurs', customerFirst: 'Client d\'abord', reliability: 'Fiabilité', transparency: 'Transparence', innovation: 'Innovation', integrity: 'Intégrité', excellence: 'Excellence', globalConnection: 'Connexion Mondiale' }
    },
    services: {
      title: 'Nos Services', subtitle: 'Solutions logistiques complètes', viewAll: 'Voir Services', getQuote: 'Devis', keyFeatures: 'Caractéristiques:',
      air: { title: 'Fret Aérien', shortDesc: 'Vitesse', desc: 'Solutions de fret aérien premium.' },
      ocean: { title: 'Fret Maritime', shortDesc: 'Portée Mondiale', desc: 'Service maritime fiable.' },
      warehouse: { title: 'Entreposage', shortDesc: 'Stockage Intelligent', desc: 'Installations modernes.' },
      road: { title: 'Fret Routier', shortDesc: 'Précision', desc: 'Réseau de transport routier.' }
    },
    priorities: {
      title: 'Nos Priorités', subtitle: 'Valeurs fondamentales',
      customer: { title: 'Client Centric', desc: 'Tranquillité d\'esprit.' },
      innovation: { title: 'Innovation', desc: 'IA et suivi digital.' },
      sustainability: { title: 'Durabilité', desc: 'Avenir plus vert.' },
      connectivity: { title: 'Connectivité', desc: 'Marchés mondiaux.' }
    },
    testimonials: { title: 'Avis Clients', subtitle: 'Entreprises nous font confiance' },
    cta: {
      title: 'Prêt à Expédier?', subtitle: 'Rejoignez des milliers d\'entreprises.', learnMore: 'En Savoir Plus', contactSales: 'Contacter Ventes',
      contactTeam: 'Contacter Équipe', backToHome: 'Retour Accueil', customSolution: 'Solution Personnalisée?', customSolutionDesc: 'Experts en logistique sur mesure.'
    },
    footer: {
      companyDesc: 'Votre partenaire logistique de confiance.', quickLinks: 'Liens', support: 'Support', legal: 'Légal', staff: 'Personnel',
      about: 'À Propos', services: 'Services', trackParcel: 'Suivre Colis', getQuote: 'Devis', helpCenter: 'Aide', contactUs: 'Contactez-Nous',
      faqs: 'FAQ', liveChat: 'Chat', terms: 'Conditions', privacy: 'Confidentialité', cookies: 'Cookies', staffPortal: 'Portail Personnel',
      rights: '© 2026 Parcel Point. Tous droits réservés.'
    },
    about: {
      title: 'À Propos de PARCEL POINT', visionTitle: 'Notre Vision', visionText: 'Approche boîte de verre.',
      whoWeAreTitle: 'Qui Nous Sommes', whoWeAreText: 'Fondés sur précision et vitesse.',
      whyChooseTitle: 'Pourquoi Nous Choisir?', precision: 'Précision', global: 'Portée Mondiale', adaptive: 'Adaptabilité', security: 'Sécurité'
    },
    contact: {
      title: 'Contactez-Nous', subtitle: 'Envoyez-nous un message', name: 'Nom', email: 'Email', phone: 'Téléphone', subject: 'Sujet', message: 'Message',
      send: 'Envoyer', sending: 'Envoi...', successTitle: 'Message Envoyé!', successText: 'Nous répondrons bientôt.'
    },
    track: {
      title: 'Suivre Votre Envoi', enterId: 'Entrez ID', trackButton: 'Suivre', trackingId: 'ID Suivi', status: 'Statut',
      origin: 'Origine', destination: 'Destination', estimatedDelivery: 'Livraison Estimée', progress: 'Progrès', history: 'Historique',
      backToHome: 'Retour', tryAgain: 'Réessayer', invalidId: 'ID invalide'
    },
    common: { loading: 'Chargement...', error: 'Erreur', retry: 'Réessayer', close: 'Fermer', save: 'Sauvegarder', cancel: 'Annuler', submit: 'Envoyer' }
  },
  DE: {
    nav: { home: 'Startseite', about: 'Über Uns', services: 'Dienstleistungen', track: 'Verfolgen', contact: 'Kontakt', staff: 'Mitarbeiterportal' },
    hero: {
      title1: 'Globale Logistik', title2: 'Vereinfacht',
      description: 'Verfolgen Sie Sendungen in Echtzeit. Schnelle und zuverlässige Dienste.',
      trackingLabel: 'Tracking-Nummer', placeholder: 'z.B., PP-AWB-1234-2026', trackButton: 'Verfolgen',
      example: 'Beispiel: PP-AWB-1234-2026', liveTracking: 'Live-Tracking'
    },
    identity: {
      title: 'Wer Wir Sind', subtitle: 'Prinzipien unserer logistischen Revolution',
      mission: { title: 'Unsere Mission', text: 'Das transparenteste Logistiknetzwerk bieten.' },
      vision: { title: 'Unsere Vision', text: 'Die Zukunft des globalen Handels definieren.' },
      values: { title: 'Werte', customerFirst: 'Kunde zuerst', reliability: 'Zuverlässigkeit', transparency: 'Transparenz', innovation: 'Innovation', integrity: 'Integrität', excellence: 'Exzellenz', globalConnection: 'Globale Verbindung' }
    },
    services: {
      title: 'Unsere Dienstleistungen', subtitle: 'Umfassende Logistiklösungen', viewAll: 'Alle anzeigen', getQuote: 'Angebot', keyFeatures: 'Merkmale:',
      air: { title: 'Luftfracht', shortDesc: 'Geschwindigkeit', desc: 'Premium-Luftfrachtlösungen.' },
      ocean: { title: 'Seefracht', shortDesc: 'Globale Reichweite', desc: 'Zuverlässiger Seefrachtservice.' },
      warehouse: { title: 'Lagerung', shortDesc: 'Intelligente Lagerung', desc: 'Modernste Lagerstätten.' },
      road: { title: 'Straßenfracht', shortDesc: 'Präzision', desc: 'Straßentransportnetzwerk.' }
    },
    priorities: {
      title: 'Unsere Prioritäten', subtitle: 'Kernwerte',
      customer: { title: 'Kundenorientierung', desc: 'Wir liefern Seelenfrieden.' },
      innovation: { title: 'Innovation', desc: 'KI und digitales Tracking.' },
      sustainability: { title: 'Nachhaltigkeit', desc: 'Grünere Zukunft.' },
      connectivity: { title: 'Konnektivität', desc: 'Globale Märkte.' }
    },
    testimonials: { title: 'Kundenbewertungen', subtitle: 'Unternehmen vertrauen uns' },
    cta: {
      title: 'Bereit zu Versenden?', subtitle: 'Schließen Sie sich Tausenden an.', learnMore: 'Mehr Erfahren', contactSales: 'Vertrieb kontaktieren',
      contactTeam: 'Team kontaktieren', backToHome: 'Zurück zur Startseite', customSolution: 'Maßlösung?', customSolutionDesc: 'Logistik-Experten maßgeschneidert.'
    },
    footer: {
      companyDesc: 'Ihr vertrauenswürdiger Logistikpartner.', quickLinks: 'Links', support: 'Support', legal: 'Rechtliches', staff: 'Mitarbeiter',
      about: 'Über Uns', services: 'Dienstleistungen', trackParcel: 'Paket verfolgen', getQuote: 'Angebot', helpCenter: 'Hilfe', contactUs: 'Kontakt',
      faqs: 'FAQ', liveChat: 'Chat', terms: 'AGB', privacy: 'Datenschutz', cookies: 'Cookies', staffPortal: 'Mitarbeiterportal',
      rights: '© 2026 Parcel Point. Alle Rechte vorbehalten.'
    },
    about: {
      title: 'Über PARCEL POINT', visionTitle: 'Unsere Vision', visionText: 'Glasbox-Ansatz.',
      whoWeAreTitle: 'Wer Wir Sind', whoWeAreText: 'Gegründet auf Präzision und Geschwindigkeit.',
      whyChooseTitle: 'Warum Wir?', precision: 'Präzision', global: 'Globale Reichweite', adaptive: 'Anpassungsfähigkeit', security: 'Sicherheit'
    },
    contact: {
      title: 'Kontaktieren Sie Uns', subtitle: 'Senden Sie uns eine Nachricht', name: 'Name', email: 'E-Mail', phone: 'Telefon', subject: 'Betreff', message: 'Nachricht',
      send: 'Senden', sending: 'Wird gesendet...', successTitle: 'Nachricht Gesendet!', successText: 'Wir antworten bald.'
    },
    track: {
      title: 'Sendung Verfolgen', enterId: 'Tracking-ID eingeben', trackButton: 'Verfolgen', trackingId: 'Tracking-ID', status: 'Status',
      origin: 'Herkunft', destination: 'Ziel', estimatedDelivery: 'Geschätzte Lieferung', progress: 'Fortschritt', history: 'Verlauf',
      backToHome: 'Zurück', tryAgain: 'Wiederholen', invalidId: 'Ungültige Tracking-ID'
    },
    common: { loading: 'Laden...', error: 'Fehler', retry: 'Wiederholen', close: 'Schließen', save: 'Speichern', cancel: 'Abbrechen', submit: 'Absenden' }
  },
  CN: {
    nav: { home: '首页', about: '关于我们', services: '服务', track: '追踪包裹', contact: '联系我们', staff: '员工门户' },
    hero: {
      title1: '全球物流', title2: '简单便捷',
      description: '实时追踪您的货物。快速可靠的服务。',
      trackingLabel: '输入追踪号码', placeholder: '例如，PP-AWB-1234-2026', trackButton: '追踪',
      example: '示例：PP-AWB-1234-2026', liveTracking: '实时追踪已激活'
    },
    identity: {
      title: '我们是谁', subtitle: '指导我们革新全球物流的原则',
      mission: { title: '我们的使命', text: '提供最透明可靠的物流网络。' },
      vision: { title: '我们的愿景', text: '定义全球商业的未来。' },
      values: { title: '核心价值观', customerFirst: '客户至上', reliability: '可靠性', transparency: '透明度', innovation: '创新', integrity: '诚信', excellence: '卓越', globalConnection: '全球连接' }
    },
    services: {
      title: '我们的服务', subtitle: '量身定制的综合物流解决方案', viewAll: '查看所有服务', getQuote: '获取报价', keyFeatures: '主要特点：',
      air: { title: '空运', shortDesc: '速度毫不妥协', desc: '优质空运解决方案。' },
      ocean: { title: '海运', shortDesc: '全球覆盖', desc: '可靠的海运服务。' },
      warehouse: { title: '仓储', shortDesc: '智能仓储', desc: '最先进的仓储设施。' },
      road: { title: '陆运', shortDesc: '最后一英里精准', desc: '公路运输网络。' }
    },
    priorities: {
      title: '我们的首要优先事项', subtitle: '核心价值观',
      customer: { title: '以客户为中心', desc: '我们交付安心。' },
      innovation: { title: '创新', desc: '人工智能和数字追踪。' },
      sustainability: { title: '可持续性', desc: '更绿色的未来。' },
      connectivity: { title: '全球连接', desc: '全球市场。' }
    },
    testimonials: { title: '客户评价', subtitle: '企业信赖我们' },
    cta: {
      title: '准备发货？', subtitle: '加入数千家企业。', learnMore: '了解更多', contactSales: '联系销售',
      contactTeam: '联系团队', backToHome: '返回首页', customSolution: '需要定制解决方案？', customSolutionDesc: '物流专家量身定制。'
    },
    footer: {
      companyDesc: '您值得信赖的全球物流合作伙伴。', quickLinks: '快速链接', support: '支持', legal: '法律', staff: '员工',
      about: '关于我们', services: '服务', trackParcel: '追踪包裹', getQuote: '获取报价', helpCenter: '帮助中心', contactUs: '联系我们',
      faqs: '常见问题', liveChat: '在线客服', terms: '条款和条件', privacy: '隐私政策', cookies: 'Cookie政策', staffPortal: '员工门户',
      rights: '© 2026 Parcel Point。保留所有权利。'
    },
    about: {
      title: '关于PARCEL POINT', visionTitle: '我们的愿景', visionText: '玻璃盒方法。',
      whoWeAreTitle: '我们是谁', whoWeAreText: '建立在精准和速度之上。',
      whyChooseTitle: '为什么选择我们？', precision: '精准追踪', global: '全球覆盖', adaptive: '适应性', security: '安全第一'
    },
    contact: {
      title: '联系我们', subtitle: '给我们发送消息', name: '姓名', email: '电子邮件', phone: '电话', subject: '主题', message: '消息',
      send: '发送', sending: '发送中...', successTitle: '消息已发送！', successText: '我们将很快回复。'
    },
    track: {
      title: '追踪您的货物', enterId: '输入追踪ID', trackButton: '追踪', trackingId: '追踪ID', status: '状态',
      origin: '出发地', destination: '目的地', estimatedDelivery: '预计送达', progress: '进度', history: '历史',
      backToHome: '返回首页', tryAgain: '重试', invalidId: '无效的追踪ID'
    },
    common: { loading: '加载中...', error: '发生错误', retry: '重试', close: '关闭', save: '保存', cancel: '取消', submit: '提交' }
  },
  AR: {
    nav: { home: 'الرئيسية', about: 'من نحن', services: 'الخدمات', track: 'تتبع الشحنة', contact: 'اتصل بنا', staff: 'بوابة الموظفين' },
    hero: {
      title1: 'الخدمات اللوجستية', title2: 'المبسطة',
      description: 'تتبع شحناتك في الوقت الفعلي. خدمات سريعة وموثوقة.',
      trackingLabel: 'أدخل رقم التتبع', placeholder: 'مثال، PP-AWB-1234-2026', trackButton: 'تتبع',
      example: 'مثال: PP-AWB-1234-2026', liveTracking: 'التتبع المباشر نشط'
    },
    identity: {
      title: 'من نحن', subtitle: 'المبادئ التي توجه رحلتنا',
      mission: { title: 'مهمتنا', text: 'توفير أكثر شبكات الخدمات اللوجستية شفافية.' },
      vision: { title: 'رؤيتنا', text: 'تحديد مستقبل التجارة العالمية.' },
      values: { title: 'القيم الأساسية', customerFirst: 'العميل أولاً', reliability: 'الموثوقية', transparency: 'الشفافية', innovation: 'الابتكار', integrity: 'النزاهة', excellence: 'التميز', globalConnection: 'التواصل العالمي' }
    },
    services: {
      title: 'خدماتنا', subtitle: 'حلول لوجستية شاملة', viewAll: 'عرض جميع الخدمات', getQuote: 'احصل على عرض', keyFeatures: 'الميزات الرئيسية:',
      air: { title: 'الشحن الجوي', shortDesc: 'سرعة دون مساومة', desc: 'حلول الشحن الجوي المتميزة.' },
      ocean: { title: 'الشحن البحري', shortDesc: 'الوصول العالمي', desc: 'خدمة الشحن البحري الموثوقة.' },
      warehouse: { title: 'التخزين', shortDesc: 'تخزين ذكي', desc: 'مرافق تخزين حديثة.' },
      road: { title: 'الشحن البري', shortDesc: 'دقة الميل الأخير', desc: 'شبكة النقل البري.' }
    },
    priorities: {
      title: 'أولوياتنا الرئيسية', subtitle: 'القيم الأساسية',
      customer: { title: 'التركيز على العميل', desc: 'نحن نقدم راحة البال.' },
      innovation: { title: 'الابتكار', desc: 'الذكاء الاصطناعي والتتبع الرقمي.' },
      sustainability: { title: 'الاستدامة', desc: 'مستقبل أكثر خضرة.' },
      connectivity: { title: 'الاتصال العالمي', desc: 'الأسواق العالمية.' }
    },
    testimonials: { title: 'آراء العملاء', subtitle: 'الشركات تثق بنا' },
    cta: {
      title: 'مستعد للشحن؟', subtitle: 'انضم إلى آلاف الشركات.', learnMore: 'تعرف أكثر', contactSales: 'اتصل بالمبيعات',
      contactTeam: 'اتصل بالفريق', backToHome: 'العودة للرئيسية', customSolution: 'حل مخصص؟', customSolutionDesc: 'خبراء اللوجستيات حسب الطلب.'
    },
    footer: {
      companyDesc: 'شريكك الموثوق في الخدمات اللوجستية العالمية.', quickLinks: 'روابط سريعة', support: 'الدعم', legal: 'قانوني', staff: 'الموظفين',
      about: 'من نحن', services: 'الخدمات', trackParcel: 'تتبع الشحنة', getQuote: 'احصل على عرض', helpCenter: 'مركز المساعدة', contactUs: 'اتصل بنا',
      faqs: 'الأسئلة الشائعة', liveChat: 'دردشة مباشرة', terms: 'الشروط والأحكام', privacy: 'سياسة الخصوصية', cookies: 'سياسة الكوكيز', staffPortal: 'بوابة الموظفين',
      rights: '© 2026 Parcel Point. جميع الحقوق محفوظة.'
    },
    about: {
      title: 'عن PARCEL POINT', visionTitle: 'رؤيتنا', visionText: 'نهج الصندوق الزجاجي.',
      whoWeAreTitle: 'من نحن', whoWeAreText: 'مؤسسة على الدقة والسرعة.',
      whyChooseTitle: 'لماذا تختارنا؟', precision: 'الدقة', global: 'الوصول العالمي', adaptive: 'القدرة على التكيف', security: 'الأمان'
    },
    contact: {
      title: 'اتصل بنا', subtitle: 'أرسل لنا رسالة', name: 'الاسم', email: 'البريد الإلكتروني', phone: 'الهاتف', subject: 'الموضوع', message: 'الرسالة',
      send: 'إرسال', sending: 'جاري الإرسال...', successTitle: 'تم إرسال الرسالة!', successText: 'سنرد قريباً.'
    },
    track: {
      title: 'تتبع شحنتك', enterId: 'أدخل معرف التتبع', trackButton: 'تتبع', trackingId: 'معرف التتبع', status: 'الحالة',
      origin: 'الأصل', destination: 'الوجهة', estimatedDelivery: 'التسليم المتوقع', progress: 'التقدم', history: 'التاريخ',
      backToHome: 'العودة للرئيسية', tryAgain: 'حاول مرة أخرى', invalidId: 'معرف تتبع غير صالح'
    },
    common: { loading: 'جاري التحميل...', error: 'حدث خطأ', retry: 'إعادة المحاولة', close: 'إغلاق', save: 'حفظ', cancel: 'إلغاء', submit: 'إرسال' }
  },
  PT: {
    nav: { home: 'Início', about: 'Sobre Nós', services: 'Serviços', track: 'Rastrear', contact: 'Contato', staff: 'Portal do Funcionário' },
    hero: {
      title1: 'Logística Global', title2: 'Simplificada',
      description: 'Rastreie suas remessas em tempo real. Serviços rápidos e confiáveis.',
      trackingLabel: 'Número de rastreamento', placeholder: 'ex., PP-AWB-1234-2026', trackButton: 'Rastrear',
      example: 'Exemplo: PP-AWB-1234-2026', liveTracking: 'Rastreamento Ao Vivo'
    },
    identity: {
      title: 'Quem Somos', subtitle: 'Princípios que guiam nossa revolução logística',
      mission: { title: 'Nossa Missão', text: 'Fornecer a rede logística mais transparente.' },
      vision: { title: 'Nossa Visão', text: 'Definir o futuro do comércio global.' },
      values: { title: 'Valores', customerFirst: 'Cliente em Primeiro', reliability: 'Confiabilidade', transparency: 'Transparência', innovation: 'Inovação', integrity: 'Integridade', excellence: 'Excelência', globalConnection: 'Conexão Global' }
    },
    services: {
      title: 'Nossos Serviços', subtitle: 'Soluções logísticas completas', viewAll: 'Ver Serviços', getQuote: 'Orçamento', keyFeatures: 'Características:',
      air: { title: 'Carga Aérea', shortDesc: 'Velocidade', desc: 'Soluções premium de carga aérea.' },
      ocean: { title: 'Carga Marítima', shortDesc: 'Alcance Global', desc: 'Serviço confiável de carga marítima.' },
      warehouse: { title: 'Armazenagem', shortDesc: 'Armazenagem Inteligente', desc: 'Instalações modernas de armazenagem.' },
      road: { title: 'Carga Rodoviária', shortDesc: 'Precisão', desc: 'Rede de transporte rodoviário.' }
    },
    priorities: {
      title: 'Nossas Prioridades', subtitle: 'Valores fundamentais',
      customer: { title: 'Foco no Cliente', desc: 'Entregamos tranquilidade.' },
      innovation: { title: 'Inovação', desc: 'IA e rastreamento digital.' },
      sustainability: { title: 'Sustentabilidade', desc: 'Futuro mais verde.' },
      connectivity: { title: 'Conectividade', desc: 'Mercados globais.' }
    },
    testimonials: { title: 'Depoimentos', subtitle: 'Empresas confiam em nós' },
    cta: {
      title: 'Pronto para Enviar?', subtitle: 'Junte-se a milhares de empresas.', learnMore: 'Saiba Mais', contactSales: 'Contatar Vendas',
      contactTeam: 'Contatar Equipe', backToHome: 'Voltar ao Início', customSolution: 'Solução Personalizada?', customSolutionDesc: 'Experts em logística sob medida.'
    },
    footer: {
      companyDesc: 'Seu parceiro confiável em logística global.', quickLinks: 'Links', support: 'Suporte', legal: 'Legal', staff: 'Funcionários',
      about: 'Sobre Nós', services: 'Serviços', trackParcel: 'Rastrear', getQuote: 'Orçamento', helpCenter: 'Central de Ajuda', contactUs: 'Fale Conosco',
      faqs: 'FAQ', liveChat: 'Chat', terms: 'Termos', privacy: 'Privacidade', cookies: 'Cookies', staffPortal: 'Portal do Funcionário',
      rights: '© 2026 Parcel Point. Todos os direitos reservados.'
    },
    about: {
      title: 'Sobre a PARCEL POINT', visionTitle: 'Nossa Visão', visionText: 'Abordagem de caixa de vidro.',
      whoWeAreTitle: 'Quem Somos', whoWeAreText: 'Fundada em precisão e velocidade.',
      whyChooseTitle: 'Por Que Nos Escolher?', precision: 'Precisão', global: 'Alcance Global', adaptive: 'Adaptabilidade', security: 'Segurança'
    },
    contact: {
      title: 'Fale Conosco', subtitle: 'Envie-nos uma mensagem', name: 'Nome', email: 'Email', phone: 'Telefone', subject: 'Assunto', message: 'Mensagem',
      send: 'Enviar', sending: 'Enviando...', successTitle: 'Mensagem Enviada!', successText: 'Responderemos em breve.'
    },
    track: {
      title: 'Rastrear Sua Remessa', enterId: 'Digite o ID', trackButton: 'Rastrear', trackingId: 'ID de Rastreamento', status: 'Status',
      origin: 'Origem', destination: 'Destino', estimatedDelivery: 'Entrega Estimada', progress: 'Progresso', history: 'Histórico',
      backToHome: 'Voltar', tryAgain: 'Tentar Novamente', invalidId: 'ID de rastreamento inválido'
    },
    common: { loading: 'Carregando...', error: 'Erro', retry: 'Tentar Novamente', close: 'Fechar', save: 'Salvar', cancel: 'Cancelar', submit: 'Enviar' }
  },
  IT: {
    nav: { home: 'Home', about: 'Chi Siamo', services: 'Servizi', track: 'Traccia', contact: 'Contatto', staff: 'Portale Staff' },
    hero: {
      title1: 'Logistica Globale', title2: 'Semplificata',
      description: 'Traccia le tue spedizioni in tempo reale. Servizi rapidi e affidabili.',
      trackingLabel: 'Numero di tracking', placeholder: 'es., PP-AWB-1234-2026', trackButton: 'Traccia',
      example: 'Esempio: PP-AWB-1234-2026', liveTracking: 'Tracking Live'
    },
    identity: {
      title: 'Chi Siamo', subtitle: 'Principi che guidano la nostra rivoluzione logistica',
      mission: { title: 'La Nostra Missione', text: 'Fornire la rete logistica più trasparente.' },
      vision: { title: 'La Nostra Visione', text: 'Definire il futuro del commercio globale.' },
      values: { title: 'Valori', customerFirst: 'Cliente Prima', reliability: 'Affidabilità', transparency: 'Trasparenza', innovation: 'Innovazione', integrity: 'Integrità', excellence: 'Eccellenza', globalConnection: 'Connessione Globale' }
    },
    services: {
      title: 'I Nostri Servizi', subtitle: 'Soluzioni logistiche complete', viewAll: 'Vedi Servizi', getQuote: 'Preventivo', keyFeatures: 'Caratteristiche:',
      air: { title: 'Trasporto Aereo', shortDesc: 'Velocità', desc: 'Soluzioni premium di trasporto aereo.' },
      ocean: { title: 'Trasporto Marittimo', shortDesc: 'Portata Globale', desc: 'Servizio affidabile di trasporto marittimo.' },
      warehouse: { title: 'Magazzinaggio', shortDesc: 'Magazzino Intelligente', desc: 'Strutture moderne di magazzinaggio.' },
      road: { title: 'Trasporto Stradale', shortDesc: 'Precisione', desc: 'Rete di trasporto stradale.' }
    },
    priorities: {
      title: 'Le Nostre Priorità', subtitle: 'Valori fondamentali',
      customer: { title: 'Focus sul Cliente', desc: 'Offriamo tranquillità.' },
      innovation: { title: 'Innovazione', desc: 'IA e tracking digitale.' },
      sustainability: { title: 'Sostenibilità', desc: 'Futuro più verde.' },
      connectivity: { title: 'Connettività', desc: 'Mercati globali.' }
    },
    testimonials: { title: 'Testimonianze', subtitle: 'Aziende si fidano di noi' },
    cta: {
      title: 'Pronto per Spedire?', subtitle: 'Unisciti a migliaia di aziende.', learnMore: 'Scopri di Più', contactSales: 'Contatta Vendite',
      contactTeam: 'Contatta Team', backToHome: 'Torna alla Home', customSolution: 'Soluzione Personalizzata?', customSolutionDesc: 'Esperti di logistica su misura.'
    },
    footer: {
      companyDesc: 'Il tuo partner affidabile in logistica globale.', quickLinks: 'Link', support: 'Supporto', legal: 'Legale', staff: 'Staff',
      about: 'Chi Siamo', services: 'Servizi', trackParcel: 'Traccia', getQuote: 'Preventivo', helpCenter: 'Centro Aiuto', contactUs: 'Contattaci',
      faqs: 'FAQ', liveChat: 'Chat', terms: 'Termini', privacy: 'Privacy', cookies: 'Cookie', staffPortal: 'Portale Staff',
      rights: '© 2026 Parcel Point. Tutti i diritti riservati.'
    },
    about: {
      title: 'Chi è PARCEL POINT', visionTitle: 'La Nostra Visione', visionText: 'Approscatola di vetro.',
      whoWeAreTitle: 'Chi Siamo', whoWeAreText: 'Fondata su precisione e velocità.',
      whyChooseTitle: 'Perché Sceglierci?', precision: 'Precisione', global: 'Portata Globale', adaptive: 'Adattabilità', security: 'Sicurezza'
    },
    contact: {
      title: 'Contattaci', subtitle: 'Inviaci un messaggio', name: 'Nome', email: 'Email', phone: 'Telefono', subject: 'Oggetto', message: 'Messaggio',
      send: 'Invia', sending: 'Invio...', successTitle: 'Messaggio Inviato!', successText: 'Risponderemo presto.'
    },
    track: {
      title: 'Traccia la Tua Spedizione', enterId: 'Inserisci ID', trackButton: 'Traccia', trackingId: 'ID Tracking', status: 'Stato',
      origin: 'Origine', destination: 'Destinazione', estimatedDelivery: 'Consegna Stimata', progress: 'Progresso', history: 'Cronologia',
      backToHome: 'Torna alla Home', tryAgain: 'Riprova', invalidId: 'ID tracking non valido'
    },
    common: { loading: 'Caricamento...', error: 'Errore', retry: 'Riprova', close: 'Chiudi', save: 'Salva', cancel: 'Annulla', submit: 'Invia' }
  },
  NL: {
    nav: { home: 'Home', about: 'Over Ons', services: 'Diensten', track: 'Volgen', contact: 'Contact', staff: 'Medewerker Portaal' },
    hero: {
      title1: 'Wereldwijde Logistiek', title2: 'Vereenvoudigd',
      description: 'Volg uw zendingen in realtime. Snelle en betrouwbare diensten.',
      trackingLabel: 'Trackingnummer', placeholder: 'bijv., PP-AWB-1234-2026', trackButton: 'Volgen',
      example: 'Voorbeeld: PP-AWB-1234-2026', liveTracking: 'Live Tracking'
    },
    identity: {
      title: 'Wie Wij Zijn', subtitle: 'Principes die onze logistieke revolutie leiden',
      mission: { title: 'Onze Missie', text: 'Het meest transparante logistieke netwerk bieden.' },
      vision: { title: 'Onze Visie', text: 'De toekomst van de wereldhandel definiëren.' },
      values: { title: 'Waarden', customerFirst: 'Klant Eerst', reliability: 'Betrouwbaarheid', transparency: 'Transparantie', innovation: 'Innovatie', integrity: 'Integriteit', excellence: 'Excellentie', globalConnection: 'Wereldwijde Verbinding' }
    },
    services: {
      title: 'Onze Diensten', subtitle: 'Complete logistieke oplossingen', viewAll: 'Bekijk Diensten', getQuote: 'Offerte', keyFeatures: 'Kenmerken:',
      air: { title: 'Luchtvracht', shortDesc: 'Snelheid', desc: 'Premium luchtvrachtoplossingen.' },
      ocean: { title: 'Zeevracht', shortDesc: 'Wereldwijd Bereik', desc: 'Betrouwbare zeevrachtdienst.' },
      warehouse: { title: 'Opslag', shortDesc: 'Slimme Opslag', desc: 'Moderne opslagfaciliteiten.' },
      road: { title: 'Wegvracht', shortDesc: 'Precisie', desc: 'Wegtransportnetwerk.' }
    },
    priorities: {
      title: 'Onze Prioriteiten', subtitle: 'Kernwaarden',
      customer: { title: 'Klantgerichtheid', desc: 'Wij bieden gemoedsrust.' },
      innovation: { title: 'Innovatie', desc: 'AI en digitale tracking.' },
      sustainability: { title: 'Duurzaamheid', desc: 'Groenere toekomst.' },
      connectivity: { title: 'Connectiviteit', desc: 'Wereldwijde markten.' }
    },
    testimonials: { title: 'Getuigenissen', subtitle: 'Bedrijven vertrouwen op ons' },
    cta: {
      title: 'Klaar om te Verzenden?', subtitle: 'Sluit u aan bij duizenden bedrijven.', learnMore: 'Meer Weten', contactSales: 'Contact Verkoop',
      contactTeam: 'Contact Team', backToHome: 'Terug naar Home', customSolution: 'Maatoplossing?', customSolutionDesc: 'Logistiek experts op maat.'
    },
    footer: {
      companyDesc: 'Uw betrouwbare partner in wereldwijde logistiek.', quickLinks: 'Links', support: 'Ondersteuning', legal: 'Juridisch', staff: 'Medewerkers',
      about: 'Over Ons', services: 'Diensten', trackParcel: 'Volgen', getQuote: 'Offerte', helpCenter: 'Helpcentrum', contactUs: 'Neem Contact Op',
      faqs: 'FAQ', liveChat: 'Chat', terms: 'Voorwaarden', privacy: 'Privacy', cookies: 'Cookies', staffPortal: 'Medewerker Portaal',
      rights: '© 2026 Parcel Point. Alle rechten voorbehouden.'
    },
    about: {
      title: 'Over PARCEL POINT', visionTitle: 'Onze Visie', visionText: 'Glazen doos benadering.',
      whoWeAreTitle: 'Wie Wij Zijn', whoWeAreText: 'Gevestigd op precisie en snelheid.',
      whyChooseTitle: 'Waarom Ons Kiezen?', precision: 'Precisie', global: 'Wereldwijd Bereik', adaptive: 'Aanpasbaarheid', security: 'Veiligheid'
    },
    contact: {
      title: 'Neem Contact Op', subtitle: 'Stuur ons een bericht', name: 'Naam', email: 'E-mail', phone: 'Telefoon', subject: 'Onderwerp', message: 'Bericht',
      send: 'Versturen', sending: 'Versturen...', successTitle: 'Bericht Verstuurd!', successText: 'We reageren binnenkort.'
    },
    track: {
      title: 'Volg Uw Zending', enterId: 'Voer ID in', trackButton: 'Volgen', trackingId: 'Tracking ID', status: 'Status',
      origin: 'Herkomst', destination: 'Bestemming', estimatedDelivery: 'Geschatte Levering', progress: 'Voortgang', history: 'Geschiedenis',
      backToHome: 'Terug naar Home', tryAgain: 'Opnieuw Proberen', invalidId: 'Ongeldig tracking ID'
    },
    common: { loading: 'Laden...', error: 'Fout', retry: 'Opnieuw Proberen', close: 'Sluiten', save: 'Opslaan', cancel: 'Annuleren', submit: 'Versturen' }
  }
} as const;
