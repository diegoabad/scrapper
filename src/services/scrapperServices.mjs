import puppeteer from "puppeteer";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const login = async (page, user, pass) => {
  // Iniciar sesión en la página
  await page.goto("https://www4.sii.cl/consdcvinternetui/#/index");
  await page.setViewport({ width: 1080, height: 1024 });

  const userInput = await page.waitForSelector("#rutcntr");
  const passInput = await page.waitForSelector("#clave");
  const buttonLogin = await page.waitForSelector("#bt_ingresar");

  await userInput.type(user);
  await passInput.type(pass);
  await buttonLogin.click();
  await page.waitForNavigation({ waitUntil: "networkidle0" });
};

const selectOption = async (page, selector, value) => {
  try {
    // Espera a que el elemento esté presente en la página
    await page.waitForSelector(selector);

    // Selecciona la opción
    await page.select(selector, value);

    console.log(`Opción '${value}' seleccionada en '${selector}'.`);
  } catch (error) {
    console.error(
      `Error al seleccionar opción en '${selector}': ${error.message}`
    );
  }
};

const clickButton = async (page, selector) => {
  // Hacer clic en un botón
  await page.click(selector);
};

export async function main({ month, year, user, pass, operationType }) {
  const arr = [];
  const userClean = user.replace(/-/g, "");

  const browser = await puppeteer.launch({
    headless: "new",
    args: [
      "--disable-notifications",
      "--user-data-dir=./user-data", // Directorio de datos del usuario
      "--multiple-downloads",
      "--download.default_directory=/your/download/path",
      "--no-sandbox",
    ],
  });

  const page = await browser.newPage();

  try {
    // Iniciar sesión
    await login(page, user, pass);

    // Selección del mes
    await selectOption(page, "#periodoMes", month);

    // Selección del año
    await selectOption(page, '[ng-model="periodoAnho"]', year);

    // Hacer clic en el botón "Consultar"
    await clickButton(page, ".btn.btn-default.btn-xs-block.btn-block");

    const buttonText = "Descargar Detalles";

    if (operationType === "compra" || operationType === "ambos") {
      // Espera a que aparezca el botón "Descargar Detalles"
      await page.waitForFunction(
        (text) => {
          const buttons = document.querySelectorAll(".col-md-6 button");
          for (const button of buttons) {
            if (button.textContent === text) {
              return true;
            }
          }
          return false;
        },
        {},
        buttonText
      );

      page.on("response", async (response) => {
        if (
          response
            .url()
            .includes(
              "https://www4.sii.cl/consdcvinternetui/services/data/facadeService/getDetalleCompraExport"
            )
        ) {
          const responseData = await response.json();
          const dataToSave = {
            data: responseData.data,
            nombreArchivo: responseData.nombreArchivo,
            metaData: responseData.metaData,
            respEstado: responseData.respEstado,
          };
          arr.push({ compras: responseData.data });
          const compraFolderPath = path.join(
            __dirname,
            `download/${userClean}/compras`
          );
          const compraFileName = `${year}-${month}.json`;

          await fs.mkdir(compraFolderPath, { recursive: true });

          const compraFilePath = path.join(compraFolderPath, compraFileName);
          await fs.writeFile(
            compraFilePath,
            JSON.stringify(dataToSave, null, 2)
          );
          console.log(`Archivo JSON de compra guardado en: ${compraFilePath}`);
        }
      });

      // Hacer clic en el botón "Descargar Detalles"
      await page.evaluate((text) => {
        const buttons = document.querySelectorAll(".col-md-6 button");
        for (const button of buttons) {
          if (button.textContent === text) {
            button.click();
            break; // Haz clic en el primer botón que coincide
          }
        }
      }, buttonText);

      // const response = await page.waitForResponse(response => {
      //   return response.url().includes('https://www4.sii.cl/consdcvinternetui/services/data/facadeService/getDetalleCompraExport');
      // });

      // const responseData = await response.json();
      // const dataToSave = {
      //   data: responseData.data,
      //   nombreArchivo: responseData.nombreArchivo,
      //   metaData: responseData.metaData,
      //   respEstado: responseData.respEstado,
      // };
      // const compraFolderPath = path.join(__dirname, '/download/compras');
      // const compraFileName = `${year}-${month}.json`;

      // await fs.mkdir(compraFolderPath, { recursive: true });

      // const compraFilePath = path.join(compraFolderPath, compraFileName);
      // await fs.writeFile(compraFilePath, JSON.stringify(dataToSave, null, 2));
      // console.log(`Archivo JSON de compra guardado en: ${compraFilePath}`);

      // const ventaFolderPath = path.join(__dirname, 'download/ventas');
      // const ventaFileName = `${year}-${month}.json`;

      // await fs.mkdir(ventaFolderPath, { recursive: true });

      // const ventaFilePath = path.join(ventaFolderPath, ventaFileName);
      // await fs.writeFile(ventaFilePath, JSON.stringify(dataToSave, null, 2));
      // console.log(`Archivo JSON de venta guardado en: ${ventaFilePath}`);
    }

    if (operationType === "venta" || operationType === "ambos") {
      // Hacer clic en el enlace de "VENTA"
      await page.evaluate(() => {
        const ventaLink = document.querySelector('a[href="#venta/"]');
        ventaLink.click(); // Simula el clic en el enlace "VENTA"
      });
      await page.waitForNavigation({ waitUntil: "networkidle0" }); // Espera a que la página de ventas cargue completamente
      await page.waitForFunction(
        (text) => {
          const buttons = document.querySelectorAll(".col-md-6 button");
          for (const button of buttons) {
            if (button.textContent === text) {
              return true;
            }
          }
          return false;
        },
        {},
        buttonText
      );

      // Hacer clic en el botón "Descargar Detalles"
      await page.evaluate((text) => {
        const buttons = document.querySelectorAll(".col-md-6 button");
        for (const button of buttons) {
          if (button.textContent === text) {
            button.click();
            break; // Haz clic en el primer botón que coincide
          }
        }
      }, buttonText);

      const response = await page.waitForResponse((response) => {
        return response
          .url()
          .includes(
            "https://www4.sii.cl/consdcvinternetui/services/data/facadeService/getDetalleVentaExport"
          );
      });

      const responseData = await response.json();

      const dataToSave = {
        data: responseData.data,
        nombreArchivo: responseData.nombreArchivo,
        metaData: responseData.metaData,
        respEstado: responseData.respEstado,
      };

      arr.push({ ventas: responseData.data });
      const ventaFolderPath = path.join(
        __dirname,
        `download/${userClean}/ventas`
      );
      const ventaFileName = `${year}-${month}.json`;

      await fs.mkdir(ventaFolderPath, { recursive: true });

      const ventaFilePath = path.join(ventaFolderPath, ventaFileName);
      await fs.writeFile(ventaFilePath, JSON.stringify(dataToSave, null, 2));
      console.log(`Archivo JSON de venta guardado en: ${ventaFilePath}`);
    }
  } catch (error) {
    console.error("Ocurrió un error:", error);
  } finally {
    await new Promise((resolve) => setTimeout(resolve, 1000));
    // Cierra el navegador cuando hayas terminado
    await browser.close();
    return arr;
  }
}
