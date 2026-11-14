'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowLeft, ShieldCheck, FileText, Cookie, Phone, MapPin } from 'lucide-react';
import { Locale } from '@/types';
import { brandTheme } from '@/config/theme';
import { cn } from '@/lib/utils';

export type LegalDocType = 'regulamin' | 'prywatnosc' | 'cookies';

interface LegalDocumentViewProps {
  locale: Locale;
  activeDoc: LegalDocType;
}

interface LegalSection {
  title: string;
  paragraphs: string[];
  bullets?: string[];
}

export function LegalDocumentView({ locale, activeDoc }: LegalDocumentViewProps) {
  const isPl = locale === 'pl';

  const tabs: Array<{ id: LegalDocType; href: string; label: string; icon: React.ReactNode }> = [
    {
      id: 'regulamin',
      href: `/${locale}/regulamin`,
      label: isPl ? 'Regulamin' : 'Правила та умови',
      icon: <FileText className="w-4 h-4 shrink-0" />,
    },
    {
      id: 'prywatnosc',
      href: `/${locale}/polityka-prywatnosci`,
      label: isPl ? 'Polityka Prywatności (RODO)' : 'Політика конфіденційності (RODO)',
      icon: <ShieldCheck className="w-4 h-4 shrink-0" />,
    },
    {
      id: 'cookies',
      href: `/${locale}/polityka-cookies`,
      label: isPl ? 'Polityka Cookies i Alergeny' : 'Політика Cookies та Алергени',
      icon: <Cookie className="w-4 h-4 shrink-0" />,
    },
  ];

  const getDocumentContent = (): {
    badge: string;
    heading: string;
    subtitle: string;
    updatedAt: string;
    sections: LegalSection[];
  } => {
    if (activeDoc === 'regulamin') {
      return isPl
        ? {
            badge: 'Dokument prawny',
            heading: 'Regulamin Sklepu i Zamówień Online',
            subtitle:
              'Zasady składania zamówień, dostawy, płatności oraz reklamacji w serwisie internetowym Maks Sushi Świdnica (maks-sushi.pl).',
            updatedAt: 'Ostatnia aktualizacja: 2026 r.',
            sections: [
              {
                title: '§ 1. Postanowienia ogólne',
                paragraphs: [
                  '1. Niniejszy Regulamin określa zasady korzystania z serwisu internetowego dostępnego pod adresem https://maks-sushi.pl oraz zasady składania i realizacji zamówień na dania gastronomiczne oferowane przez restaurację Maks Sushi Świdnica z siedzibą przy ul. Parkowej 8, 58-100 Świdnica.',
                  '2. Kontakt z obsługą restauracji możliwy jest telefonicznie pod numerem: +48 791 744 048 lub osobiście w lokalu przy ul. Parkowej 8 w Świdnicy.',
                  '3. Złożenie zamówienia za pośrednictwem strony internetowej oznacza zapoznanie się i akceptację postanowień niniejszego Regulaminu.',
                ],
              },
              {
                title: '§ 2. Składanie i realizacja zamówień',
                paragraphs: [
                  '1. Zamówienia za pośrednictwem strony https://maks-sushi.pl można składać w godzinach otwarcia restauracji wskazanych w stopce oraz nagłówku serwisu (lub z wyprzedzeniem na kolejny dzień roboczy w przypadku wstrzymania bieżących zamówień).',
                  '2. W celu prawidłowej realizacji zamówienia Klient zobowiązany jest do podania prawdziwych danych kontaktowych: imienia, aktywnego numeru telefonu oraz — w przypadku dostawy kurierem — dokładnego adresu dostawy.',
                  '3. Wszystkie dania przygotowywane są na bieżąco ze świeżych składników bezpośrednio po przyjęciu zamówienia przez kuchnię.',
                  '4. W przypadku uzasadnionych wątpliwości co do autentyczności zamówienia lub błędnie podanego adresu, obsługa lokalu ma prawo skontaktować się z Klientem telefonicznie w celu weryfikacji zamówienia.',
                ],
              },
              {
                title: '§ 3. Dostawa oraz odbiór osobisty',
                paragraphs: [
                  '1. Zamówione pozycje mogą zostać odebrane osobiście w lokalu przy ul. Parkowej 8 w Świdnicy lub dostarczone pod wskazany adres na terenie Świdnicy oraz okolicznych miejscowości w strefie dostawy (do 10 km od granic miasta).',
                  '2. Koszt dostawy oraz próg darmowej dostawy na terenie Świdnicy są automatycznie wyliczane i widoczne w koszyku przed finalizacją zamówienia.',
                  '3. Podany na stronie czas oczekiwania ma charakter orientacyjny i może ulec zmianie w zależności od natężenia ruchu w kuchni, warunków drogowych oraz pogodowych.',
                ],
              },
              {
                title: '§ 4. Ceny i metody płatności',
                paragraphs: [
                  '1. Wszystkie ceny prezentowane w menu serwisu maks-sushi.pl podane są w polskich złotych (PLN) i są cenami brutto (zawierają podatek VAT).',
                  '2. Klient może wybrać jedną z dostępnych metod płatności przy odbiorze zamówienia lub u kuriera:',
                ],
                bullets: [
                  'Gotówka przy odbiorze zamówienia (w lokalu lub u kuriera);',
                  'Płatność bezgotówkowa kartą płatniczą lub kodem BLIK przez terminal płatniczy przy odbiorze / u kuriera.',
                ],
              },
              {
                title: '§ 5. Promocje, rabaty i programy lojalnościowe',
                paragraphs: [
                  '1. Restauracja może organizować akcje promocyjne, takie jak rabat powitalny na pierwsze zamówienie dla zarejestrowanych użytkowników czy rolka gratis przy zamówieniu powyżej określonej kwoty.',
                  '2. Rabaty i promocje naliczane są automatycznie w koszyku po spełnieniu warunków danej oferty i nie podlegają wymianie na ekwiwalent pieniężny.',
                ],
              },
              {
                title: '§ 6. Prawo odstąpienia od umowy oraz reklamacje',
                paragraphs: [
                  '1. Zgodnie z art. 38 pkt 4 Ustawy z dnia 30 maja 2014 r. o prawach konsumenta, prawo odstąpienia od umowy zawartej na odległość nie przysługuje Konsumentowi w odniesieniu do umów, w których przedmiotem świadczenia są rzeczy ulegające szybkiemu zepsuciu lub mające krótki termin przydatności do spożycia (świeże dania gastronomiczne i sushi przygotowywane na zamówienie).',
                  '2. W przypadku zastrzeżeń dotyczących jakości otrzymanego zamówienia lub niezgodności zamówienia z paragonem, Klient proszony jest o niezwłoczny kontakt telefoniczny pod numerem +48 791 744 048 w dniu otrzymania zamówienia.',
                  '3. Reklamacje rozpatrywane są niezwłocznie przez obsługę lokalu na korzyść zadowolenia Klienta (np. poprzez wymianę dania, dosłanie brakującej pozycji lub stosowny rabat).',
                ],
              },
              {
                title: '§ 7. Postanowienia końcowe',
                paragraphs: [
                  '1. W sprawach nieuregulowanych w niniejszym Regulaminie zastosowanie mają przepisy prawa polskiego, w szczególności Kodeksu cywilnego oraz Ustawy o prawach konsumenta.',
                  '2. Konsument ma możliwość skorzystania z pozasądowych sposobów rozpatrywania reklamacji i dochodzenia roszczeń.',
                ],
              },
            ],
          }
        : {
            badge: 'Юридичний документ',
            heading: 'Правила та умови замовлень (Regulamin)',
            subtitle:
              'Умови оформлення онлайн-замовлень, доставки, оплати та розгляду звернень у сервісі Maks Sushi Świdnica (maks-sushi.pl).',
            updatedAt: 'Останнє оновлення: 2026 р.',
            sections: [
              {
                title: '§ 1. Загальні положення',
                paragraphs: [
                  '1. Ці Правила (Regulamin) визначають умови користування вебсайтом https://maks-sushi.pl, а також порядок оформлення й виконання замовлень на страви, які пропонує ресторан Maks Sushi Świdnica за адресою: ul. Parkowa 8, 58-100 Świdnica, Польща.',
                  '2. Звʼязатися з адміністрацією закладу можна за телефоном: +48 791 744 048 або особисто у закладі на вул. Parkowa 8 у Свідниці.',
                  '3. Оформлення замовлення на сайті означає ознайомлення та згоду Клієнта з цими Правилами.',
                ],
              },
              {
                title: '§ 2. Оформлення та виконання замовлень',
                paragraphs: [
                  '1. Замовлення через сайт https://maks-sushi.pl приймаються у робочі години закладу, вказані в шапці та футері сайту (або попередньо на наступний робочий день у разі перевантаження кухні).',
                  '2. Для коректного виконання замовлення Клієнт вказує дійсні контактні дані: імʼя, активний номер телефону та — у разі курʼєрської доставки — точну адресу доставки.',
                  '3. Усі роли та страви готуються виключно зі свіжих інгредієнтів безпосередньо після прийняття замовлення кухнею.',
                  '4. У разі необхідності уточнення деталей замовлення або адреси адміністратор закладу може звʼязатися з Клієнтом за вказаним номером телефону.',
                ],
              },
              {
                title: '§ 3. Доставка та самовивіз',
                paragraphs: [
                  '1. Замовлені страви можна забрати самостійно у закладі за адресою ul. Parkowa 8, 58-100 Świdnica або замовити з доставкою курʼєром по території Свідниці та прилеглих населених пунктів (у радіусі до 10 км).',
                  '2. Вартість доставки та поріг безкоштовної доставки по Свідниці розраховуються автоматично і відображаються у кошику перед підтвердженням замовлення.',
                  '3. Орієнтовний час очікування вказується під час оформлення і може змінюватися залежно від завантаженості кухні та дорожньої ситуації.',
                ],
              },
              {
                title: '§ 4. Ціни та способи оплати',
                paragraphs: [
                  '1. Усі ціни в меню на сайті maks-sushi.pl вказані в польських злотих (PLN) з урахуванням податку ПДВ (VAT).',
                  '2. Клієнт може обрати зручний спосіб оплати під час отримання замовлення:',
                ],
                bullets: [
                  'Готівкою при отриманні (у закладі або курʼєру);',
                  'Банківською карткою або кодом BLIK через платіжний термінал при отриманні / у курʼєра.',
                ],
              },
              {
                title: '§ 5. Акції та знижки',
                paragraphs: [
                  '1. Заклад може проводити акційні пропозиції, зокрема вітальну знижку на перше замовлення для зареєстрованих клієнтів та подарунковий рол при замовленні від визначеної суми.',
                  '2. Акційні пропозиції застосовуються автоматично у кошику при виконанні умов акції та не підлягають обміну на грошовий еквівалент.',
                ],
              },
              {
                title: '§ 6. Відмова від замовлення та рекламації',
                paragraphs: [
                  '1. Відповідно до ст. 38 п. 4 Закону Польщі про права споживачів (Ustawa o prawach konsumenta), право на відмову від дистанційного договору не поширюється на свіжоприготовані гастрономічні страви з коротким терміном придатності після початку їх приготування.',
                  '2. У разі виникнення зауважень щодо якості або комплектації замовлення, просимо негайно звернутися за телефоном +48 791 744 048 у день отримання замовлення.',
                  '3. Усі звернення розглядаються оперативно на користь Клієнта (заміна страви, досилання позиції або компенсаційний бонус).',
                ],
              },
              {
                title: '§ 7. Прикінцеві положення',
                paragraphs: [
                  '1. У питаннях, не врегульованих цими Правилами, застосовуються норми законодавства Республіки Польща.',
                ],
              },
            ],
          };
    }

    if (activeDoc === 'prywatnosc') {
      return isPl
        ? {
            badge: 'Ochrona danych RODO',
            heading: 'Polityka Prywatności i Ochrony Danych Osobowych (RODO)',
            subtitle:
              'Informacje o tym, jak przetwarzamy i chronimy Twoje dane osobowe podczas składania zamówień w Maks Sushi Świdnica.',
            updatedAt: 'Ostatnia aktualizacja: 2026 r.',
            sections: [
              {
                title: '§ 1. Administrator Danych Osobowych',
                paragraphs: [
                  '1. Administratorem Twoich danych osobowych przekazywanych za pośrednictwem serwisu https://maks-sushi.pl jest Maks Sushi Świdnica z siedzibą przy ul. Parkowej 8, 58-100 Świdnica.',
                  '2. W sprawach związanych z ochroną danych osobowych można skontaktować się z Administratorem telefonicznie pod numerem: +48 791 744 048 lub osobiście w siedzibie lokalu.',
                ],
              },
              {
                title: '§ 2. Zakres i cele przetwarzania danych',
                paragraphs: [
                  '1. Przetwarzamy wyłącznie dane niezbędne do przygotowania i dostarczenia zamówienia oraz obsługi konta Klienta: imię i nazwisko, numer telefonu, adres dostawy, adres e-mail (opcjonalnie) oraz historię zamówień.',
                  '2. Dane osobowe przetwarzane są zgodnie z Rozporządzeniem Parlamentu Europejskiego i Rady (UE) 2016/679 (RODO) w następujących celach:',
                ],
                bullets: [
                  'Realizacja zamówienia gastronomicznego i dostawy pod wskazany adres (art. 6 ust. 1 lit. b RODO — wykonanie umowy);',
                  'Obsługa konta użytkownika w serwisie, w tym naliczenie rabatu na pierwsze zamówienie oraz zapamiętanie adresu dostawy (art. 6 ust. 1 lit. b RODO);',
                  'Wypełnienie obowiązków podatkowych i księgowych (art. 6 ust. 1 lit. c RODO);',
                  'Rozpatrywanie ewentualnych reklamacji oraz zapewnienie bezpieczeństwa serwisu (art. 6 ust. 1 lit. f RODO — prawnie uzasadniony interes Administratora).',
                ],
              },
              {
                title: '§ 3. Bezpieczeństwo i odbiorcy danych',
                paragraphs: [
                  '1. Połączenie z serwisem maks-sushi.pl jest w pełni szyfrowane protokołem SSL/TLS (HTTPS), a baza danych zabezpieczona jest politykami kontroli dostępu (Row Level Security).',
                  '2. Twoje dane nie są sprzedawane ani udostępniane podmiotom trzecim w celach marketingowych. Dostęp do danych mają wyłącznie upoważnieni pracownicy restauracji realizujący zamówienie i dostawę oraz dostawcy infrastruktury IT obsługujący system zamówień zgodnie z wymogami RODO.',
                ],
              },
              {
                title: '§ 4. Okres przechowywania danych',
                paragraphs: [
                  '1. Dane związane z realizacją zamówienia przechowywane są przez okres niezbędny do wykonania zamówienia oraz przez czas wymagany przepisami prawa podatkowego i rachunkowego.',
                  '2. Dane konta Klienta przechowywane są przez czas posiadania konta w serwisie lub do momentu zgłoszenia żądania ich usunięcia.',
                ],
              },
              {
                title: '§ 5. Prawa osoby, której dane dotyczą',
                paragraphs: [
                  'Każdemu Klientowi przysługuje prawo do:',
                ],
                bullets: [
                  'Dostępu do treści swoich danych osobowych oraz otrzymania ich kopii;',
                  'Sprostowania (poprawienia) swoich danych w profilu Klienta lub poprzez kontakt z obsługą;',
                  'Usunięcia danych („prawo do bycia zapomnianym”) lub ograniczenia ich przetwarzania;',
                  'Wniesienia sprzeciwu wobec przetwarzania danych;',
                  'Wniesienia skargi do Prezesa Urzędu Ochrony Danych Osobowych (UODO), jeśli uzna, że przetwarzanie narusza przepisy RODO.',
                ],
              },
            ],
          }
        : {
            badge: 'Захист даних RODO / GDPR',
            heading: 'Політика конфіденційності та захисту персональних даних (RODO)',
            subtitle:
              'Як ми збираємо, використовуємо та захищаємо ваші персональні дані під час замовлення суші в Maks Sushi Świdnica.',
            updatedAt: 'Останнє оновлення: 2026 р.',
            sections: [
              {
                title: '§ 1. Адміністратор персональних даних',
                paragraphs: [
                  '1. Адміністратором персональних даних користувачів сайту https://maks-sushi.pl є ресторан Maks Sushi Świdnica, розташований за адресою: ul. Parkowa 8, 58-100 Świdnica, Польща.',
                  '2. З усіх питань щодо захисту персональних даних ви можете звернутися за телефоном: +48 791 744 048 або безпосередньо в закладі.',
                ],
              },
              {
                title: '§ 2. Які дані ми збираємо та з якою метою',
                paragraphs: [
                  '1. Ми обробляємо лише ті дані, які необхідні для приготування та доставки вашого замовлення: імʼя, номер телефону, адресу доставки, e-mail (за бажанням) та історію замовлень.',
                  '2. Обробка персональних даних здійснюється відповідно до Регламенту ЄС 2016/679 (GDPR / RODO) з такою метою:',
                ],
                bullets: [
                  'Прийняття, приготування та доставка замовлення курʼєром або підготовка на самовивіз (ст. 6 ч. 1 п. b RODO);',
                  'Робота особистого кабінету клієнта, збереження адреси доставки та нарахування вітальної знижки на перше замовлення (ст. 6 ч. 1 п. b RODO);',
                  'Виконання бухгалтерських і податкових зобовʼязань згідно із законодавством Польщі (ст. 6 ч. 1 п. c RODO);',
                  'Розгляд звернень клієнтів і захист сайту від зловживань (ст. 6 ч. 1 п. f RODO).',
                ],
              },
              {
                title: '§ 3. Безпека та збереження даних',
                paragraphs: [
                  '1. Передача даних на сайті maks-sushi.pl захищена сучасним SSL/TLS-шифруванням (HTTPS), а база даних захищена правилами розмежування доступу (Row Level Security).',
                  '2. Ми ніколи не передаємо і не продаємо ваші дані стороннім компаніям для спаму чи реклами. Доступ до даних замовлення мають виключно працівники закладу для виконання доставки.',
                ],
              },
              {
                title: '§ 4. Ваші права згідно з RODO',
                paragraphs: [
                  'Кожен користувач має право на:',
                ],
                bullets: [
                  'Доступ до своїх персональних даних та отримання їх копії;',
                  'Виправлення або оновлення даних в особистому кабінеті;',
                  'Повне видалення свого облікового запису та персональних даних за запитом;',
                  'Обмеження обробки даних або подання скарги до наглядового органу (UODO).',
                ],
              },
            ],
          };
    }

    // activeDoc === 'cookies'
    return isPl
      ? {
          badge: 'Cookies & Informacje żywieniowe',
          heading: 'Polityka Plików Cookies oraz Informacje o Alergenach',
          subtitle:
            'Zasady działania pamięci przeglądarki na stronie maks-sushi.pl oraz wykaz alergenów pokarmowych zgodnie z wymogami UE.',
          updatedAt: 'Ostatnia aktualizacja: 2026 r.',
          sections: [
            {
              title: '§ 1. Czym są pliki Cookies i pamięć lokalna (LocalStorage)?',
              paragraphs: [
                '1. Serwis internetowy https://maks-sushi.pl wykorzystuje pliki cookies (tzw. „ciasteczka”) oraz bezpieczną pamięć lokalną przeglądarki (LocalStorage) w celu zapewnienia prawidłowego działania strony na komputerach i smartfonach.',
                '2. Stosowane przez nas rozwiązania mają charakter czysto funkcjonalny i techniczny — nie zbierają poufnych informacji bez wiedzy użytkownika.',
              ],
            },
            {
              title: '§ 2. W jakim celu używamy plików Cookies?',
              paragraphs: [
                'W serwisie maks-sushi.pl wykorzystujemy wyłącznie niezbędne pliki techniczne i funkcjonalne, które odpowiadają za:',
              ],
              bullets: [
                'Zapamiętanie zawartości Twojego koszyka, wybranych dodatków oraz liczby kompletów pałeczek podczas przeglądania menu;',
                'Zapamiętanie wybranej wersji językowej strony (język polski / język ukraiński);',
                'Utrzymanie bezpiecznej sesji zalogowanego Klienta w panelu konta.',
              ],
            },
            {
              title: '§ 3. Zarządzanie plikami Cookies',
              paragraphs: [
                '1. Użytkownik może w każdej chwili samodzielnie zmienić ustawienia dotyczące plików cookies lub wyczyścić pamięć podręczną w ustawieniach swojej przeglądarki internetowej (Chrome, Safari, Firefox, Edge, Opera).',
                '2. Całkowite zablokowanie pamięci lokalnej przeglądarki może jednak spowodować utratę zawartości koszyka po odświeżeniu strony.',
              ],
            },
            {
              title: '§ 4. Informacja o alergenach pokarmowych',
              paragraphs: [
                '1. Zgodnie z Rozporządzeniem Parlamentu Europejskiego i Rady (UE) nr 1169/2011 w sprawie przekazywania konsumentom informacji na temat żywności, przy każdej pozycji w menu (w karcie szczegółów dania) zamieszczamy wykaz obecnych w niej alergenów.',
                '2. Ze względu na specyfikę kuchni japońskiej oraz przygotowywanie posiłków w jednej przestrzeni gastronomicznej, w daniach mogą występować następujące alergeny (lub ich śladowe ilości):',
              ],
              bullets: [
                'Ryby i produkty pochodne (np. łosoś, tuńczyk, węgorz, maślana);',
                'Skorupiaki i mięczaki (np. krewetki, paluszki krabowe surimi);',
                'Soja i produkty pochodne (sos sojowy, pasta miso, tofu);',
                'Zboża zawierające gluten (np. panierka panko, tempura, sosy japońskie);',
                'Nasiona sezamu i produkty pochodne;',
                'Mleko i produkty pochodne, w tym laktoza (np. serek śmietankowy typu Philadelphia);',
                'Jaja i produkty pochodne (np. japoński majonez, ciasto tempura, omlet tamago);',
                'Gorczyca, seler, orzechy ziemne i inne orzechy.',
              ],
            },
            {
              title: '§ 5. Konsultacja w sprawie alergii',
              paragraphs: [
                'W przypadku silnej alergii lub nietolerancji pokarmowej prosimy o zamieszczenie stosownej informacji w polu „Komentarz do zamówienia” w kasie lub bezpośredni kontakt telefoniczny z obsługą przed złożeniem zamówienia: +48 791 744 048.',
              ],
            },
          ],
        }
      : {
          badge: 'Cookies та харчова інформація',
          heading: 'Політика файлів Cookies та Інформація про алергени',
          subtitle:
            'Правила використання локальної памʼяті браузера на сайті maks-sushi.pl та перелік харчових алергенів згідно з нормами ЄС.',
          updatedAt: 'Останнє оновлення: 2026 р.',
          sections: [
            {
              title: '§ 1. Що таке файли Cookies та LocalStorage?',
              paragraphs: [
                '1. Вебсайт https://maks-sushi.pl використовує технічні файли cookies та локальне сховище браузера (LocalStorage) для стабільної та зручної роботи сайту на телефонах і компʼютерах.',
                '2. Ці технології є безпечними й використовуються виключно для базових функцій замовлення страв.',
              ],
            },
            {
              title: '§ 2. Для чого ми використовуємо Cookies?',
              paragraphs: [
                'На сайті maks-sushi.pl використовуються необхідні функціональні дані для:',
              ],
              bullets: [
                'Збереження вибраних страв у вашому кошику, додаткових опцій та кількості паличок під час перегляду меню;',
                'Запамʼятовування обраної мови інтерфейсу (польська / українська);',
                'Підтримки авторизованої сесії в особистому кабінеті клієнта.',
              ],
            },
            {
              title: '§ 3. Керування файлами Cookies',
              paragraphs: [
                '1. Ви можете в будь-який момент очистити або обмежити використання файлів cookies у налаштуваннях свого браузера (Safari, Chrome, Firefox, Edge).',
                '2. Зверніть увагу, що повне вимкнення локальної памʼяті браузера може призвести до очищення кошика після перезавантаження сторінки.',
              ],
            },
            {
              title: '§ 4. Інформація про харчові алергени',
              paragraphs: [
                '1. Відповідно до Регламенту ЄС № 1169/2011 щодо інформування споживачів про харчові продукти, у картці кожної страви нашого меню зазначено перелік наявних алергенів.',
                '2. У стравах японської кухні можуть міститися такі основні алергени (або їх сліди, оскільки всі страви готуються на одній кухні):',
              ],
              bullets: [
                'Риба та морепродукти (лосось, тунець, вугор, масляна риба);',
                'Ракоподібні та молюски (креветки, крабові палички сурімі);',
                'Соя та соєві продукти (соєвий соус, тофу, паста місо);',
                'Злаки, що містять глютен (сухарі панко, кляр темпура, соуси унагі/теріякі);',
                'Насіння кунжуту;',
                'Молочні продукти та лактоза (вершковий крем-сир);',
                'Яйця та продукти з них (японський майонез, кляр темпура, омлет тамаго);',
                'Гірчиця, селера, арахіс та горіхи.',
              ],
            },
            {
              title: '§ 5. Повідомлення про алергію',
              paragraphs: [
                'Якщо у вас є харчова алергія або індивідуальна непереносимість окремих інгредієнтів, будь ласка, обовʼязково вкажіть це у полі «Коментар до замовлення» під час оформлення або зателефонуйте нам: +48 791 744 048.',
              ],
            },
          ],
        };
  };

  const doc = getDocumentContent();

  return (
    <div className="min-h-[75vh] bg-[#09090b] text-zinc-200 py-8 sm:py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6 sm:space-y-8">
        {/* Верхня навігація: кнопка повернення в меню + перемикач між юридичними сторінками */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-white/10">
          <Link
            href={`/${locale}`}
            style={{
              clipPath: 'polygon(8px 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%, 0 8px)',
            }}
            className="inline-flex items-center gap-2 px-4 py-2 bg-[#14141d] hover:bg-[#e50914] text-zinc-200 hover:text-white border border-white/10 hover:border-[#e50914] text-xs sm:text-sm font-bold transition-all w-fit"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>{isPl ? 'Powrót do menu' : 'Повернутися до меню'}</span>
          </Link>

          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
            {tabs.map((tab) => {
              const isActive = tab.id === activeDoc;
              return (
                <Link
                  key={tab.id}
                  href={tab.href}
                  style={{
                    clipPath: 'polygon(6px 0, 100% 0, 100% calc(100% - 6px), calc(100% - 6px) 100%, 0 100%, 0 6px)',
                  }}
                  className={cn(
                    'inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold transition-all border',
                    isActive
                      ? 'bg-[#e50914] text-white border-[#e50914] shadow-md shadow-[#e50914]/25'
                      : 'bg-[#12121a] text-zinc-400 hover:text-white border-white/10 hover:border-white/25'
                  )}
                >
                  {tab.icon}
                  <span>{tab.label}</span>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Заголовок документа */}
        <div
          style={{
            clipPath: 'polygon(16px 0, 100% 0, 100% calc(100% - 16px), calc(100% - 16px) 100%, 0 100%, 0 16px)',
          }}
          className="bg-gradient-to-br from-[#14141f] via-[#101018] to-[#1a0a0d] border border-white/10 p-5 sm:p-8 space-y-3"
        >
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#e50914]/15 border border-[#e50914]/30 text-[#ff4d58] text-[11px] font-black uppercase tracking-wider">
              {doc.badge}
            </span>
            <span className="text-xs text-zinc-500 font-mono">{doc.updatedAt}</span>
          </div>
          <h1 className="text-xl sm:text-3xl font-black text-white tracking-tight">
            {doc.heading}
          </h1>
          <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed max-w-3xl">
            {doc.subtitle}
          </p>
        </div>

        {/* Основний зміст по параграфах */}
        <div className="space-y-4">
          {doc.sections.map((sec, idx) => (
            <section
              key={idx}
              className="bg-[#0e0e15] border border-white/8 rounded-2xl p-5 sm:p-6 space-y-3 hover:border-white/15 transition-colors"
            >
              <h2 className="text-sm sm:text-base font-black text-white uppercase tracking-wide flex items-center gap-2">
                <span className="w-1.5 h-4 bg-[#e50914] rounded-full shrink-0" />
                <span>{sec.title}</span>
              </h2>
              <div className="space-y-2 text-xs sm:text-sm text-zinc-300 leading-relaxed">
                {sec.paragraphs.map((p, pIdx) => (
                  <p key={pIdx}>{p}</p>
                ))}
                {sec.bullets && sec.bullets.length > 0 && (
                  <ul className="space-y-1.5 pt-1 pl-1">
                    {sec.bullets.map((b, bIdx) => (
                      <li key={bIdx} className="flex items-start gap-2.5 text-zinc-300">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#e50914] shrink-0 mt-2" />
                        <span>{b}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </section>
          ))}
        </div>

        {/* Блок реквізитів та контактів у кінці документа */}
        <div className="bg-[#12121b] border border-white/10 rounded-2xl p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <h3 className="text-xs sm:text-sm font-black text-white uppercase tracking-wider">
              {isPl ? 'Dane kontaktowe lokalu' : 'Контактні дані закладу'}
            </h3>
            <p className="text-xs text-zinc-400">
              {brandTheme.name} — {brandTheme.contacts.address}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3 text-xs font-semibold">
            <a
              href={`tel:${brandTheme.contacts.phoneRaw}`}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-zinc-200 hover:text-white transition-colors"
            >
              <Phone className="w-3.5 h-3.5 text-[#e50914]" />
              <span>{brandTheme.contacts.phone}</span>
            </a>
            <a
              href={brandTheme.contacts.googleMapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-zinc-200 hover:text-white transition-colors"
            >
              <MapPin className="w-3.5 h-3.5 text-[#e50914]" />
              <span>{brandTheme.contacts.shortAddress}</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
