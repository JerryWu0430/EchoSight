# EchoSight Personalization Frontend

A modern, responsive web interface for personalizing and configuring EchoSight's audio-visual feedback system. Built with Next.js 14, TypeScript, and Tailwind CSS.

## Features

- **Theme Customization**: Light/dark mode support
- **Responsive Design**: Mobile-first approach
- **Modern UI Components**: Built with shadcn/ui
- **Form Handling**: Type-safe form management
- **Real-time Updates**: Instant feedback on changes

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: shadcn/ui
- **Form Management**: React Hook Form
- **State Management**: Context API
- **Development Tools**: ESLint, PostCSS

## Getting Started

### Prerequisites

- Node.js 18.17 or later
- npm or yarn

### Installation

1. Clone the repository and navigate to the frontend directory:
```bash
cd personalization_fe
```

2. Install dependencies (using --legacy-peer-deps for compatibility):
```bash
npm install --legacy-peer-deps
# or
yarn install --legacy-peer-deps
```

### Development

Run the development server:
```bash
npm run dev
# or
yarn dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Build

Create a production build:
```bash
npm run build
# or
yarn build
```

Start the production server:
```bash
npm run start
# or
yarn start
```

## Project Structure

```
personalization_fe/
├── app/                 # Next.js app router pages
├── components/         # Reusable UI components
├── context/           # React Context providers
├── lib/               # Utility functions
├── public/            # Static assets
├── styles/            # Global styles
└── types/             # TypeScript type definitions
```

## Key Components

- **Theme Switcher**: Toggle between light and dark modes
- **Form Components**: Customizable input fields and controls
- **Layout Components**: Responsive page layouts
- **Audio Preview**: Test audio feedback settings
- **Visual Preview**: Real-time visualization of settings

## Configuration

### Environment Variables

Create a `.env.local` file with:
```env
NEXT_PUBLIC_API_URL=your_api_url
```

### Tailwind Configuration

Customize theme in `tailwind.config.ts`:
- Colors
- Typography
- Spacing
- Breakpoints

## Development Guidelines

1. **Component Creation**:
   - Use TypeScript for type safety
   - Follow atomic design principles
   - Include component documentation

2. **Styling**:
   - Use Tailwind CSS utilities
   - Follow mobile-first approach
   - Maintain dark mode support

3. **State Management**:
   - Use Context API for global state
   - Keep component state local when possible
   - Implement proper error boundaries

## Troubleshooting

Common issues and solutions:

1. **Dependency Conflicts**:
   ```bash
   npm install --legacy-peer-deps
   ```

2. **Build Errors**:
   - Clear `.next` directory
   - Rebuild node_modules
   ```bash
   rm -rf .next
   rm -rf node_modules
   npm install --legacy-peer-deps
   ```

3. **Type Errors**:
   - Update TypeScript definitions
   - Check component props

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit changes
4. Push to the branch
5. Open a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.
