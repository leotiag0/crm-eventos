/**
 * Loads the html2pdf.js library dynamically from CDN.
 * Returns a promise that resolves when the library is ready to use.
 */
export async function loadHtml2Pdf(): Promise<any> {
    if ((window as any).html2pdf) {
        return (window as any).html2pdf;
    }

    return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js';
        script.async = true;
        script.onload = () => {
            if ((window as any).html2pdf) {
                resolve((window as any).html2pdf);
            } else {
                reject(new Error('html2pdf failed to load.'));
            }
        };
        script.onerror = () => reject(new Error('Failed to load html2pdf script.'));
        document.head.appendChild(script);
    });
}
