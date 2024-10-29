# ![OpenTXPacker](/static/logo.png)

An open-source texture atlas packer built with Svelte 5 and Phaser 3. OpenTXPacker provides a modern, efficient alternative to TexturePacker for combining multiple textures into optimized sprite atlases.

## Features

- 🎨 Upload and combine thousands of textures into one atlas
- 📦 Efficient texture atlas packing algorithm - faster than TexturePacker!
- 🔍 Real-time preview with camera controls
- 💾 Multiple export formats (Phaser 3, Multiatlas, JSON)
- 🖼️ Support for various image formats (PNG-32, PNG-8, WebP)
- 🎮 Built with game development in mind

## Getting Started
### Prerequisites

- bun `curl -fsSL https://bun.sh/install | bash`

### Installation

1. Clone the repository:

   ```
   git clone https://github.com/andrewrexo/opentxpacker.git
   cd opentxpacker
   ```

2. Install dependencies:

   ```
   bun install
   ```

3. Start the development server:

   ```
   bun dev
   ```

4. Open your browser and navigate to `http://localhost:5173`

## Usage

1. Open the application in your browser
2. Upload textures by clicking the "Upload" button or dragging and dropping files
3. Configure export settings (format, compression, etc.)
4. Export your texture atlas!

## Technology Stack

- [Svelte 5](https://svelte.dev) - Frontend framework with runes
- [Phaser 3](https://phaser.io) - Canvas rendering and texture management
- [TailwindCSS](https://tailwindcss.com) - Styling
- [DaisyUI](https://daisyui.com) - UI components
- [TypeScript](https://www.typescriptlang.org) - Type safety and DX boosts

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the project
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a PR. I'll review it as soon as I can!

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Inspired by [TexturePacker](https://www.codeandweb.com/texturepacker). Even though this project _may_ have been started out of spite it still wouldn't have been possible without them.
