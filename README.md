# **VanTS**

This is a [TypeScript](https://www.typescriptlang.org/) adaptation of the VanJS project. This repository serves as a personal exploration and skill development project, aiming to delve deeper into the source code of VanJS by translating it from JavaScript to TypeScript.

## About **VanJS**

**VanJS** 🍦 is a minimalistic framework designed for building reactive user interfaces. It is known for its straightforward design and succinct implementation, serving as a practical learning tool for core concepts of reactive UI programming. More information about the original VanJS project can be found at [VanJS Official Website](https://vanjs.org).

## Goals of van-ts

- **Understand and Translate**: Deep dive into the source code of VanJS to understand its implementation and architecture.
- **Learning and Documentation**: Document the translation process and the challenges encountered, providing insights and learning experiences.
- **TypeScript Adaptation**: Adapt the original JavaScript code into TypeScript, aiming to enhance readability and accessibility for developers with various backgrounds and experience levels.
- **Community Involvement**: Encourage contributions and discussions to improve the understanding and implementation of reactive UI programming principles.

## Project Status

This project is currently in the early stages of development. The core functionalities of VanJS are being progressively translated and tested in TypeScript.

## Contributing

Contributions are welcome! Whether you are helping with translating JavaScript code to TypeScript, fixing bugs, or proposing new features, we appreciate your interest and involvement.

### How to Contribute

1. Fork the repository on GitHub.
2. Clone the project to your own machine.
3. Commit changes to your own branch.
4. Push your work back up to your fork.
5. Submit a Pull request so that we can review your changes.

## Getting Started

This section guides you through the setup required to start working with van-ts. Follow these steps to set up your development environment.

### Prerequisites

Ensure that you have [Node.js](https://nodejs.org/en) installed on your machine (Node.js 14.x or newer is recommended). This will also install npm, which is necessary to manage the project dependencies.

### Installation

#### 1. Clone the repository:

To get started, clone this repository to your local machine by running:

```bash

git clone https://github.com/ge3224/van-ts.git

```

Navigate into the project directory:

```bash

cd van-ts

```

#### 2. Install dependencies:

Install all necessary dependencies using npm:

```bash

npm install

```

### Development

To start the development server and work on the project with hot reloading, run:

```bash

npm run dev

```

This command utilizes [vite](https://vitejs.dev/), a modern frontend build tool, to serve your project with beneficial development features like fast refresh and integrated Type Checking.

### Building

Run the build script. Execute the following command to compile your TypeScript files and bundle your project using Vite:

```bash

    npm run build

```

This script performs two main tasks:

- TypeScript Compilation: The tsc (TypeScript Compiler) command compiles your .ts files into JavaScript, ensuring that all types are correct and there are no syntax errors.
- Vite Build: After TypeScript compilation, vite build bundles your JavaScript files and assets, optimizing them for production. This step reduces the size of your files and improves load times by applying advanced techniques like minification and tree shaking.

#### Output

The output of the build process will be placed in the dist directory, which will contain all your static files ready for deployment:

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Thanks to the creators and contributors of VanJS for providing a solid foundation in reactive UI programming concepts and inspiring this TypeScript adaptation.
- This project is solely for educational purposes and not affiliated with the official VanJS project.
