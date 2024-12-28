import puppeteer from 'puppeteer-core';
import { setTimeout } from "node:timers/promises";
import { executablePath } from 'puppeteer'
import fs from 'fs'

void (async () => {
    const [_, __, url, region] = process.argv
    try {
        if (!url) {
            throw new Error('нету ссылки на продуки')
        }
    } catch (err) { console.log(err.message) }
    // запускает браузер
    const browser = await puppeteer.launch({ headless: false, args: ['--window-size=1380,1080'], timeout: 10000, executablePath: executablePath(), })
    // открывает новую страницу браузера
    const page = await browser.newPage()
    //  устанавливает начальный размер страницы браузера
    const width = 1380
    await page.setViewport({ width, height: 1080 });
    // переход по необходимой ссылка
    await page.goto(url, { waitUntil: ['domcontentloaded', 'networkidle2'] }
    )
    // ждём полную загрузку страницы
    await setTimeout(8000)

    // если при запуске скрипта указан регион выполнить ожидание появления кнопки выбора региона 
    if (region) {
        // выполнить ожидание появления кнопки выбора региона 
        await page.waitForSelector('#__next > div.FeatureAppLayoutBase_layout__0HSBo.FeatureAppLayoutBase_hideBannerMobile__97CUm.FeatureAppLayoutBase_hideBannerTablet__dCMoJ.FeatureAppLayoutBase_hideBannerDesktop__gPdf1 > div:nth-child(3) > div.UiHeaderHorizontalBase_secondRow__7b4Lk > div > div.UiHeaderHorizontalBase_region__2ODCG')
        // нажать на кнопку выбрать регион
        await page.locator('#__next > div.FeatureAppLayoutBase_layout__0HSBo.FeatureAppLayoutBase_hideBannerMobile__97CUm.FeatureAppLayoutBase_hideBannerTablet__dCMoJ.FeatureAppLayoutBase_hideBannerDesktop__gPdf1 > div:nth-child(3) > div.UiHeaderHorizontalBase_secondRow__7b4Lk > div > div.UiHeaderHorizontalBase_region__2ODCG').click();
        // ждать появления модального окна 
        await page.waitForSelector('#__next > div.Modal_root__kPoVQ.Modal_open__PaUmT')
        // найти нужный регион по тексту кнопки и нажать для указания региона
        await page.evaluate((region) => {
            const elements = Array.from(document.querySelectorAll('.UiRegionListBase_item___ly_A'))
            const targetelemet = elements.find(el => el.textContent === region)
            targetelemet.click()
            return targetelemet
        }, region)
    }
    // ждём загрузки после измененния региона 
    await setTimeout(2000)
    //  собирает необходимые данные
    const data = await page.evaluate(() => {
        const priceOld = (document.querySelector('#__next > div.FeatureAppLayoutBase_layout__0HSBo.FeatureAppLayoutBase_hideBannerMobile__97CUm.FeatureAppLayoutBase_hideBannerTablet__dCMoJ.FeatureAppLayoutBase_hideBannerDesktop__gPdf1 > main > div:nth-child(3) > div > div.ProductPage_informationBlock__vDYCH > div.ProductPage_desktopBuy__cyRrC > div > div > div > div.PriceInfo_root__GX9Xp > div > span.Price_price__QzA8L.Price_size_XS__ESEhJ.Price_role_old__r1uT1').innerText).split(' ')[0];
        const price = (document.querySelector('#__next > div.FeatureAppLayoutBase_layout__0HSBo.FeatureAppLayoutBase_hideBannerMobile__97CUm.FeatureAppLayoutBase_hideBannerTablet__dCMoJ.FeatureAppLayoutBase_hideBannerDesktop__gPdf1 > main > div:nth-child(3) > div > div.ProductPage_informationBlock__vDYCH > div.ProductPage_desktopBuy__cyRrC > div > div > div > div.PriceInfo_root__GX9Xp > span').innerText).split(' ')[0];
        const rating = document.querySelector('.ActionsRow_stars__EKt42').innerText;
        const reviewCount = (document.querySelector('.ActionsRow_reviews__AfSj_').innerText).split(' ')[0];
        return { priceOld, price, rating, reviewCount };
    });
    // создаёт строку из собранных даных для записи в тхт файл
    const dataString = Object.entries(data).map(([key, value]) => `${key}=${value}\n`).join('')

    const dir = `./${url.split('/')[url.split('/').length - 1]}`;
    // проверяем есть ли папка если нет то создаём папку
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir);
    }
    // создаём файл тхт и помещаем туда собраные данные
    fs.writeFileSync(`${dir}/product.txt`, dataString)


    const contentConteinerOffsetHeight = await page.evaluate(() => {
        const loaut = document.querySelector('.FeatureAppLayoutBase_layout__0HSBo')
        // чистим ненужные стили обёртки страницы
        loaut.className = ''
        // кнопка закрытие модалки вход в лк
        const buttonExit = document.querySelector('.Tooltip_closeIcon__skwl0')
        // кнопка сбора куки файлов
        const buttonCoocke = document.querySelector('.CookiesAlert_agreeButton__cJOTA').querySelector('button')
        // закрыл модалки 
        buttonExit?.click()
        buttonCoocke?.click()
        // высота контейнеа 
        const contentConteinerOffsetHeight = (document.getElementById('__next')).offsetHeight
        return contentConteinerOffsetHeight
    })
    // выставляет необходимую высату страницы браузера 
    await page.setViewport({ width, height: contentConteinerOffsetHeight });
    // проверяет отрисовалась ли нижняя часть страницы
    await page.waitForSelector('#__next > div.FeatureAppLayoutBase_layout__0HSBo.FeatureAppLayoutBase_hideBannerMobile__97CUm.FeatureAppLayoutBase_hideBannerTablet__dCMoJ.FeatureAppLayoutBase_hideBannerDesktop__gPdf1 > footer > div.UiFooterBottomBase_footerBottom__fF9wh > div > img.UiFooterBottomBase_logo__wEbJo')
    await setTimeout(1000)
    // делает полноразмерный скриншот страницы
    await page.screenshot({ fullPage: true, omitBackground: true, path: `${dir}/screenshot.jpg` })
    // закрывает браузер
    browser.close()

})()