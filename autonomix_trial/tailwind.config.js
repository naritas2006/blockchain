module.exports = {
  darkMode: 'class',
  content: ["./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        violet: "#4A3267",
        blush: "#DE3A69",
        pink: "#F7B9C4",
        mimi: "#F3D9E5",
        thistle: "#C6BADE",
        borderLight: "#EADFEF",
        darkBg: "#292727",
        darkAccent1: "#F269F2",
        darkAccent2: "#F4685A",
        darkAccent3: "#F03455",
        darkCard: "#3A3A3A",
        darkBorder: "#4E4E4E"
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        heading: ['Quicksand', 'sans-serif'],
      },
      backgroundImage: {
        'soft-gradient': 'linear-gradient(135deg, #F3D9E5, #C6BADE)',
        'hero-glow': 'radial-gradient(ellipse at top, #F3D9E580, transparent 60%)',
        'dark-gradient': 'linear-gradient(135deg, #292727, #3A3A3A)',
      },
    },
  },
  plugins: [],
};
