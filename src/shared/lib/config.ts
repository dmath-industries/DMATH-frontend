export const mobileConfig = {
  breakpoint: 640,

  canvas: {
    padding: {
      mobile: 8,
      desktop: 16,
    },

    width: {
      min: {
        mobile: 300,
        desktop: 600,
      },
      max: {
        mobile: 600,
        desktop: 1200,
      },
    },

    height: {
      min: {
        mobile: 250,
        desktop: 500,
      },
      max: {
        mobile: 400,
        desktop: 800,
      },
    },

    headerHeight: {
      mobile: 80,
      desktop: 60,
    },

    extraSpace: {
      mobile: 350,
      desktop: 300,
    },

    defaultSize: {
      width: 800,
      height: 600,
    },
  },
} as const;

export const graphConfig = {
  nodeRadius: 180,

  center: {
    x: 0,
    y: 0,
  },

  nodeSize: {
    radius: 25,
  },

  nodeColors: {
    default: '#3b82f6', // blue-500
    target: '#8b5cf6', // purple-500
  },

  edgeColors: {
    default: '#60a5fa', // blue-400
  },

  edgeWidth: 2,

  angleRange: Math.PI * 0.8,
} as const;
