/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ['class'],
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
  	extend: {
  		fontFamily: {
  			sans: ['Inter', 'sans-serif'],
  			mono: ['JetBrains Mono', 'Courier New', 'monospace'],
  		},
  		colors: {
  			background: 'hsl(var(--background))',
  			foreground: 'hsl(var(--foreground))',
  			brutal: {
  				black: '#000000',
  				white: '#FFFFFF',
  				red: '#FF0000',
  			},
  			primary: {
  				DEFAULT: 'hsl(var(--primary))',
  				foreground: 'hsl(var(--primary-foreground))'
  			},
  			border: 'hsl(var(--border))',
  			input: 'hsl(var(--input))',
  			ring: 'hsl(var(--ring))',
  		},
  		borderWidth: {
  			'3': '3px',
  			'4': '4px',
  			'8': '8px',
  		},
  		boxShadow: {
  			'brutal': '4px 4px 0px 0px #000000',
  			'brutal-red': '4px 4px 0px 0px #FF0000',
  			'brutal-lg': '8px 8px 0px 0px #000000',
  		}
  	}
  },
  plugins: [require("tailwindcss-animate")]
}