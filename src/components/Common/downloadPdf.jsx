import html2pdf from "html2pdf.js";
import alertify from "alertifyjs";
import "alertifyjs/build/css/alertify.css";

export const downloadPdfFromPage = async ({
  url,
  elementSelector = ".qt-card",
  fileName = "document.pdf",
}) => {
  const iframe = document.createElement("iframe");

  iframe.style.position = "fixed";
  iframe.style.right = "-9999px";
  iframe.style.bottom = "0";
  iframe.style.width = "1400px";
  iframe.style.height = "1200px";
  iframe.style.border = "0";
  iframe.style.background = "#fff";

  document.body.appendChild(iframe);

  iframe.onload = async () => {
    try {
      const iframeDocument =
        iframe.contentDocument || iframe.contentWindow.document;

      // Wait until content is rendered
      let retries = 0;

      while (
        !iframeDocument.querySelector(elementSelector) &&
        retries < 20
      ) {
        await new Promise((resolve) => setTimeout(resolve, 500));
        retries++;
      }

      const element = iframeDocument.querySelector(elementSelector);

      console.log("PDF URL:", url);
      console.log("Selector:", elementSelector);
      console.log("Element Found:", element);

      if (!element) {
        alertify.alert("Error", "Unable to load template.");
        return;
      }

      // Additional wait for API data binding
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Wait for all images
      const images = iframeDocument.images;

      await Promise.all(
        Array.from(images).map((img) => {
          if (img.complete) return Promise.resolve();

          return new Promise((resolve) => {
            img.onload = resolve;
            img.onerror = resolve;
          });
        })
      );

      const options = {
        margin: 5,
        filename: fileName,

        image: {
          type: "jpeg",
          quality: 1,
        },

        html2canvas: {
          scale: 2,
          useCORS: true,
          allowTaint: true,
          scrollY: 0,
          windowWidth: 1000,
          logging: false,
        },

        jsPDF: {
          unit: "mm",
          format: "a4",
          orientation: "portrait",
        },

        pagebreak: {
          mode: ["avoid-all", "css", "legacy"],
        },
      };

      await html2pdf()
        .set(options)
        .from(element)
        .save();

    } catch (err) {
      console.error("PDF Error:", err);
      alertify.alert("Error", "PDF download failed");
    } finally {
      if (document.body.contains(iframe)) {
        document.body.removeChild(iframe);
      }
    }
  };

  iframe.src = url;
};