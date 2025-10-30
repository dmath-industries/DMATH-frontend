import HawkCatcher from '@hawk.so/javascript';

if (typeof window !== 'undefined' && process.env.NEXT_PUBLIC_HAWK_TOKEN) {
  const hawk = new HawkCatcher({
    token: process.env.NEXT_PUBLIC_HAWK_TOKEN,
    release: process.env.NEXT_PUBLIC_HAWK_RELEASE,
    consoleTracking: true,
    beforeSend(event: any) {
      if (process.env.NODE_ENV === 'development') {
        console.log('Hawk event:', event);
      }
      
      if (event.url) {
        const url = event.url.toLowerCase();
        if (
          url.includes('extensions/') ||
          url.startsWith('chrome://') ||
          url.startsWith('chrome-extension://')
        ) {
          return false;
        }
      }
      
      if (event.message) {
        const ignoredErrors = [
          'top.GLOBALS',
          'originalCreateNotification',
          'canvas.contentDocument',
          'MyApp_RemoveAllHighlights',
          'atomicFindClose',
          'fb_xd_fragment',
          'bmi_SafeAddOnload',
          'EBCallBackMessageReceived',
          'conduitPage',
        ];
        
        if (ignoredErrors.some((err) => event.message?.includes(err))) {
          return false;
        }
      }
      
      return event;
    },
  });
  
  if (typeof window !== 'undefined') {
    (window as any).hawk = hawk;
  }
} else if (typeof window !== 'undefined') {
  console.warn('Hawk token not configured. Error monitoring is disabled.');
}

