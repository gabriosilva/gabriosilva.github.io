// gitprofile.config.js

const config = {
  github: {
    username: 'gabriosilva', // Your GitHub org/user name. (Required)
    sortBy: 'stars', // stars | updated
    limit: 10, // How many projects to display.
    exclude: {
      forks: false, // Forked projects will not be displayed if set to true.
      projects: [], // These projects will not be displayed. example: ['my-project1', 'my-project2']
    },
  },
  social: {
    linkedin: 'gabrio-lina-17ba60205',
    twitter: '',
    mastodon: '',
    facebook: '',
    instagram: '',
    youtube: '', // example: 'pewdiepie'
    dribbble: '',
    behance: '',
    medium: '',
    dev: '',
    stackoverflow: '', // example: '1/jeff-atwood'
    skype: '',
    telegram: '',
    website: '',
    phone: '',
    email: 'gabrio.silva@sou.inteli.edu.br',
  },
  resume: {
    fileUrl: '', // Empty fileUrl will hide the `Download Resume` button.
  },
  skills: [
    'AWS',
    'Web Stack',
    'JavaScript | Typescript',
    'Next.js',
    'React.js',
    'Nest.js',
    'Node.js',
    'C#',
    'Flask',
    'Python',
    'Java',
    'Prisma',
    'SQL (PostgreSQL...)',
    'Jenkins',
    'Spinnaker',
    'Kubernetes',
    'Docker',
  ],
  experiences: [
    {
      company: 'Inteli Research',
      position: 'Marketing Director | Liga Acadêmica',
      from: 'April 2023',
      to: 'Present',
      companyLink: 'https://example.com',
    },
    {
      company: 'Inteli Blockchain',
      position: 'Inteli Blockchain Member',
      from: 'October 2022',
      to: 'Present',
      companyLink: 'https://example.com',
      description:
        '- Participação na organização e logística do primeiro hackathon brasileiro feito completamente por estudantes (+R$75k em prêmios)\n- Cobertura de Marketing, fotos e produção de vídeo durante o evento',
    },
    {
      company: 'BTG Pactual',
      position: 'Summer Internship | Eletronic Trading',
      from: 'July 2023',
      to: 'August 2023',
      companyLink: 'https://example.com',
      description:
        '- Desenvolvimento de plataforma de Transaction Cost Analysis (TCA), pacote python e microserviço para análises de performance de algoritmos de investimento (VWAP, TWAP, POV)',
      skills: ['Python', 'FastAPI', 'Couchbase', 'React.js'],
    },
    {
      company: 'Central Estudantil - Inteli',
      position: 'Diretor de marketing e produtos',
      from: 'May 2022',
      to: 'March 2023',
      companyLink: 'https://example.com',
      description:
        '- Planejamento e estruturação de Redes Sociais\n- Criação, planejamento e implantação de Cultura\n- Produção de vídeos e conteúdo para plataformas Digitais\n- Desenvolvimento de estratégias para lançamento de eventos',
    },
    {
      company: 'BTG Pactual',
      position: 'Summer Internship | Eletronic Trading',
      from: 'January 2023',
      to: 'February 2023',
      companyLink: 'https://example.com',
      description:
        '- Desenvolvimento de aplicação em C# e ASP.NET para testes de envio de mensagens por meio do protocolo FIX',
      skills: ['C#', 'ASP.NET', 'JavaScript'],
    },
    {
      company: 'Descomplica',
      position: 'Site Reliability Engineer jr.',
      from: 'April 2021',
      to: 'January 2022',
      description:
        '- Migração de aplicações na AWS\n- Monitoramento, gerenciamento e provisionamento de clusters kubernetes\n- Troubleshooting de incidentes\n- Implementação de scripts e APIs em python/Node, para a automação de tasks\n- CI/CD Jenkins e spinnaker.\n- Provisionamento de resources com Terraform, Ansible e packer',
      skills: [
        'Python',
        'Kubernetes',
        'Integração e entrega contínuas (CI/CD)',
        'JavaScript',
        'Jenkins',
        'spinnaker',
        'Amazon Web Services',
        'Grafana',
        'Prometheus.io',
      ],
    },
    {
      company: 'IABC - Instituto Adventista Brasil Central',
      position: 'Cyber Security Consultant',
      from: 'April 2020',
      to: 'December 2020',
      description:
        '- Análise de falhas de segurança em serviços e sistemas internos\n- Prevenção e report de vulnerabilidades SQL, Broken Authentication, Insecure Direct Object References, Broken Access Control, Exposição de Dados Sensíveis, em aplicações e serviços de alta escala.',
      skills: ['JavaScript'],
    },
    {
      company: 'IABC- Instituto Adventista Brasil Central',
      position: 'Video Producer',
      from: 'March 2019',
      to: 'December 2020',
      description:
        '- Elaboração de roteiros para curtas-metragens e pequenas produções\n- Gravação, produção e direção/codireção de curtas-metragens, clipes musicais, vídeos institucionais e entrevistas\n- Edição de vídeos com Adobe Premiere e Davinci Resolve',
      skills: [
        'DaVinci Resolve',
        'Adobe Premiere',
        'Video Editing',
        'Video Direction',
      ],
    },
  ],
  /* certifications: [
    {
      name: 'Lorem ipsum',
      body: 'Lorem ipsum dolor sit amet',
      year: 'March 2022',
      link: 'https://example.com'
    },
  ], */
  education: [
    {
      institution: 'Inteli - Institute of Technology and Leadership',
      degree: 'Computer Science',
      from: 'January 2022',
      to: 'December 2025',
    },
  ],

  // To hide the `My Projects` section, keep it empty.
  externalProjects: [
    {
      title:
        'Health is a Game - Cancer Prevention Game - USP (University of São Paulo)',
      description:
        'Game about cancer prevention methods in partnership with the Faculty of Medicine at USP.',
      imageUrl: '/assets/img/fmusp.jpg',
      link: 'https://github.com/2022M1T5-Inteli/Health-is-a-game',
    },
    {
      title:
        'FlightWise - Low-Altitude Flight Path Planner - AEL (Defense Company)',
      description:
        'Worked with a team on a software solution in Java for optimizing low-altitude fight paths to reduce collision risk and detection by monitoring systems. The project considered mission factors and constraints.',
      imageUrl: 'assets/img/ael.jpeg',
      link: 'https://github.com/2023M5T1-Inteli/grupo3',
    },
    {
      title: 'KeepGrowing - IoT - Gerdau (Brazilian Steel Producer)',
      description:
        "Worked closely with Gerdau for an IoT solution with hardware components to automate the collection of temperature and humidity data in Gerdau's greenhouses.",
      imageUrl: 'assets/img/gerdau.jpg',
      link: 'https://github.com/2022M4T5-Inteli/G4',
    },
    {
      title:
        'The Oracle - AI Prediction Model - Rede Gazeta (Brazilian TV Network)',
      description:
        'Worked on "The Oracle," a predictive model using Machine Learning to estimate TV viewership, guiding content positioning decisions for Rede Gazeta. It provided insights for preventing issues and optimizing TV program premieres. Processed datasets over 1 million entries.',
      imageUrl: 'assets/img/rede.jpg',
      link: 'https://github.com/2022M3T5-Inteli/Data-Oracles',
    },
    {
      title:
        'BladeRunner - Trim Loss Optimization Algorithm - Paper Production Company',
      description:
        "Developed a paper reel cutting optimization algorithm using advanced methodologies like genetic algorithms, simplex, and integer solvers to improve operational efficiency at one of Brazil's largest paper production companies. Focused on minimizing material and time waste.",
      imageUrl: 'assets/img/paper-company.png',
      link: 'https://github.com/2023M6T1-Inteli/grupo1_publico',
    },
    {
      title:
        'Dr. Edu - Automated School Diagnosis Tool - Falconi (Consulting Firm)',
      description:
        'Created a full-stack web application to automate the diagnostic tool for school administrators. Provides a multidimensional assessment of educational and management health for both public and private schools.',
      imageUrl: 'assets/img/falconi.png',
      link: 'https://github.com/2022M2T5-Inteli/Millenium-Dev',
    },
  ],
  // Display blog posts from your medium or dev account. (Optional)
  blog: {
    source: 'dev', // medium | dev
    username: '', // to hide blog section, keep it empty
    limit: 2, // How many posts to display. Max is 10.
  },
  googleAnalytics: {
    id: '', // GA3 tracking id/GA4 tag id UA-XXXXXXXXX-X | G-XXXXXXXXXX
  },
  // Track visitor interaction and behavior. https://www.hotjar.com
  hotjar: {
    id: '',
    snippetVersion: 6,
  },
  themeConfig: {
    defaultTheme: 'fantasy',

    // Hides the switch in the navbar
    // Useful if you want to support a single color mode
    disableSwitch: true,

    // Should use the prefers-color-scheme media-query,
    // using user system preferences, instead of the hardcoded defaultTheme
    respectPrefersColorScheme: false,

    // Hide the ring in Profile picture
    hideAvatarRing: false,

    // Available themes. To remove any theme, exclude from here.
    themes: [
      'light',
      'dark',
      'cupcake',
      'bumblebee',
      'emerald',
      'corporate',
      'synthwave',
      'retro',
      'cyberpunk',
      'valentine',
      'halloween',
      'garden',
      'forest',
      'aqua',
      'lofi',
      'pastel',
      'fantasy',
      'wireframe',
      'black',
      'luxury',
      'dracula',
      'cmyk',
      'autumn',
      'business',
      'acid',
      'lemonade',
      'night',
      'coffee',
      'winter',
      'procyon',
    ],

    // Custom theme
    customTheme: {
      primary: '#fc055b',
      secondary: '#219aaf',
      accent: '#e8d03a',
      neutral: '#2A2730',
      'base-100': '#E3E3ED',
      '--rounded-box': '3rem',
      '--rounded-btn': '3rem',
    },
  },

  // Optional Footer. Supports plain text or HTML.
  footer: `Made with <a 
      class="text-primary" href="https://github.com/arifszn/gitprofile"
      target="_blank"
      rel="noreferrer"
    >GitProfile</a> and ❤️`,
};

export default config;
