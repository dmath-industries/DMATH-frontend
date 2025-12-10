/**
 * Конфигурация для компонентов приложения
 */

/**
 * Конфигурация для адаптации под мобильные устройства
 */
export const mobileConfig = {
  /**
   * Ширина экрана, при которой устройство считается мобильным
   */
  breakpoint: 640,

  /**
   * Конфигурация для canvas
   */
  canvas: {
    /**
     * Отступы контейнера 
     */
    padding: {
      mobile: 8,
      desktop: 16,
    },

    /**
     * Ограничения по ширине 
     */
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

    /**
     * Ограничения по высоте
     */
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

    /**
     * Высота заголовка
     */
    headerHeight: {
      mobile: 80,
      desktop: 60,
    },

    /**
     * Дополнительное пространство для расчета высоты
     */
    extraSpace: {
      mobile: 350,
      desktop: 300,
    },

    /**
     * Размеры canvas по умолчанию
     */
    defaultSize: {
      width: 800,
      height: 600,
    },
  },
} as const;

