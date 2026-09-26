// The horses on the chart, one per line: name | year foaled | sire | tags | note
//
// Every line runs from sire to offspring, so following "sire" from any horse walks the male line
// back to one of the three founders. That is the line breeders call the "sire line" or "tail-male line",
// and it is the line the Y chromosome follows.
//
// Tags: founder, c = year is approximate, k = famous (labelled first), m = mare or filly, g = gelding,
//       us3 / uk3 / jp3 = won the American / English / Japanese Triple Crown.

export const FOUNDERS = ['Byerley Turk', 'Darley Arabian', 'Godolphin Arabian'];

const DATA = `
Byerley Turk | 1680 | | founder c k | Captain Robert Byerley's war horse in the 1680s and '90s, later a stallion in the north of England. The oldest of the three founders.
Darley Arabian | 1700 | | founder c k | Bought near Aleppo in Syria by Thomas Darley and shipped home to Yorkshire in 1704. He never raced. About 95% of thoroughbreds alive today descend from him in the male line.
Godolphin Arabian | 1724 | | founder c k | Foaled around 1724, probably in Yemen. He reached England by way of France and ended up at the Earl of Godolphin's stud.

Jigg | 1701 | Byerley Turk | c |
Partner | 1718 | Jigg | |
Tartar | 1743 | Partner | |
Herod | 1758 | Tartar | k | Britain's leading sire eight times. Almost every surviving branch of the Byerley Turk's line runs through him.
Highflyer | 1774 | Herod | | Unbeaten on the racecourse, then Britain's leading sire thirteen times. His male line has since died out.
Florizel | 1768 | Herod | |
Diomed | 1777 | Florizel | k | Won the first Epsom Derby, in 1780. Sold to Virginia at 21, he founded a dynasty in America.
Sir Archy | 1805 | Diomed | | The great American stallion of the early 1800s.
Timoleon | 1813 | Sir Archy | |
Boston | 1833 | Timoleon | | Won 40 of his 45 races.
Lexington | 1850 | Boston | k | Leading sire in North America sixteen times, a record that still stands. His male line has died out.
Woodpecker | 1773 | Herod | |
Buzzard | 1787 | Woodpecker | |
Castrel | 1801 | Buzzard | |
Pantaloon | 1824 | Castrel | |
Windhound | 1847 | Pantaloon | |
Thormanby | 1857 | Windhound | | Won the 1860 Derby. His mother was covered by both Windhound and Melbourne; his chestnut coat points to Windhound.
Atlantic | 1871 | Thormanby | | Won the 2,000 Guineas in 1874.
Le Sancy | 1884 | Atlantic | |
Le Samaritain | 1895 | Le Sancy | |
Roi Herode | 1904 | Le Samaritain | |
The Tetrarch | 1911 | Roi Herode | k | The "Spotted Wonder": a grey splashed with white, unbeaten in seven races as a two-year-old.
Mumtaz Mahal | 1921 | The Tetrarch | m k | "The Flying Filly." Her daughter was Nasrullah's mother, so the Byerley Turk turns up in the Darley Arabian's biggest branch after all, on the mother's side.
Selim | 1802 | Buzzard | |
Sultan | 1816 | Selim | |
Bay Middleton | 1833 | Sultan | | Won the 1836 Derby.
The Flying Dutchman | 1846 | Bay Middleton | | Won the 1849 Derby.
Dollar | 1860 | The Flying Dutchman | | Won the 1864 Goodwood Cup, then stood at stud in France. The Byerley Turk's line survives today mainly through him.
Androcles | 1870 | Dollar | |
Cambyse | 1884 | Androcles | |
Gardefeu | 1895 | Cambyse | |
Chouberski | 1902 | Gardefeu | |
Bruleur | 1910 | Chouberski | | Won the 1913 Grand Prix de Paris.
Ksar | 1918 | Bruleur | | Won the Prix de l'Arc de Triomphe in 1921 and 1922.
Tourbillon | 1928 | Ksar | k | Won the French Derby in 1931, then kept the Byerley Turk's line alive into the modern era.
Djebel | 1937 | Tourbillon | | Won the 2,000 Guineas in 1940 and the Arc in 1942.
My Babu | 1945 | Djebel | | Won the 2,000 Guineas in 1948.
Clarion | 1944 | Djebel | |
Klairon | 1952 | Clarion | |
Lorenzaccio | 1965 | Klairon | | Beat Nijinsky in the 1970 Champion Stakes, the last race of Nijinsky's career.
Ahonoora | 1975 | Lorenzaccio | |
Indian Ridge | 1985 | Ahonoora | | One of the last strong branches of the Byerley Turk's line.
Dr Devious | 1989 | Ahonoora | | Won the 1992 Derby.

Cade | 1734 | Godolphin Arabian | |
Matchem | 1748 | Cade | k | Kept the Godolphin Arabian's line going. With Herod and Eclipse, one of the three great stallions of the 1700s.
Conductor | 1767 | Matchem | |
Trumpator | 1782 | Conductor | |
Sorcerer | 1796 | Trumpator | |
Comus | 1809 | Sorcerer | |
Humphrey Clinker | 1822 | Comus | |
Melbourne | 1834 | Humphrey Clinker | |
West Australian | 1850 | Melbourne | k uk3 | The first winner of the English Triple Crown, in 1853.
Australian | 1858 | West Australian | | Went to America, where the Godolphin Arabian's line took root again.
Spendthrift | 1876 | Australian | |
Hastings | 1893 | Spendthrift | | Won the 1896 Belmont Stakes.
Fair Play | 1905 | Hastings | | Second to the unbeaten Colin in the 1908 Belmont. Better known as Man o' War's father.
Man o' War | 1917 | Fair Play | k | Won 20 of his 21 races. The one loss, in 1919, was to a horse named Upset.
War Admiral | 1934 | Man o' War | k us3 | Won the Triple Crown in 1937, then lost the famous 1938 match race to Seabiscuit, his nephew.
Hard Tack | 1926 | Man o' War | |
Seabiscuit | 1933 | Hard Tack | k | The Depression-era hero who beat War Admiral in their 1938 match race at Pimlico.
War Relic | 1938 | Man o' War | |
Intent | 1948 | War Relic | |
Intentionally | 1956 | Intent | |
In Reality | 1964 | Intentionally | |
Relaunch | 1976 | In Reality | |
Cee's Tizzy | 1987 | Relaunch | |
Tiznow | 1997 | Cee's Tizzy | k | The first horse to win the Breeders' Cup Classic twice, in 2000 and 2001. The Man o' War line's best modern stallion.
Solon | 1861 | West Australian | |
Barcaldine | 1878 | Solon | | Unbeaten.
Marco | 1892 | Barcaldine | |
Marcovil | 1903 | Marco | |
Hurry On | 1913 | Marcovil | k | Unbeaten in six races and never raced at two. A leading sire of the 1920s.
Coronach | 1923 | Hurry On | | Won the 1926 Derby.
Precipitation | 1933 | Hurry On | | Won the Ascot Gold Cup in 1937.
Sheshoon | 1956 | Precipitation | |
Sassafras | 1967 | Sheshoon | | Beat Nijinsky by a head in the 1970 Prix de l'Arc de Triomphe.

Flying Childers | 1715 | Darley Arabian | k | Called the first great racehorse in England. His line died out; his full brother's didn't.
Bartlett's Childers | 1716 | Darley Arabian | | Flying Childers' full brother. He never raced, but he carried on the line.
Squirt | 1732 | Bartlett's Childers | |
Marske | 1750 | Squirt | |
Eclipse | 1764 | Marske | k | Unbeaten in 18 races. "Eclipse first, the rest nowhere": his rivals finished so far back they couldn't be placed. Nearly every thoroughbred alive traces to him in the male line.

Pot-8-Os | 1773 | Eclipse | | His name was meant to be "Potatoes". A stable lad wrote it as Pot plus eight o's, and it stuck.
Waxy | 1790 | Pot-8-Os | | Won the 1793 Derby.
Whalebone | 1807 | Waxy | | Won the 1810 Derby.
Sir Hercules | 1826 | Whalebone | |
Birdcatcher | 1833 | Sir Hercules | | An Irish stallion whose white-flecked coat gave the name "Birdcatcher ticks".
The Baron | 1842 | Birdcatcher | | Won the 1845 St Leger.
Stockwell | 1849 | The Baron | k | The "Emperor of Stallions", leading sire in Britain seven times.
Doncaster | 1870 | Stockwell | | Won the 1873 Derby.
Bend Or | 1877 | Doncaster | | Won the 1880 Derby.
Ormonde | 1883 | Bend Or | k uk3 | Unbeaten in 16 races, including the 1886 English Triple Crown.
Orme | 1889 | Ormonde | |
Flying Fox | 1896 | Orme | uk3 | Won the English Triple Crown in 1899.
Ajax | 1901 | Flying Fox | | Won the French Derby in 1904.
Teddy | 1913 | Ajax | |
Sir Gallahad | 1920 | Teddy | | Brought from France to Kentucky, where he was leading sire four times.
Gallant Fox | 1927 | Sir Gallahad | k us3 | Won the Triple Crown in 1930.
Omaha | 1932 | Gallant Fox | us3 | Won the Triple Crown in 1935. He and Gallant Fox are the only father and son who both won it.
Bull Dog | 1927 | Teddy | |
Bull Lea | 1935 | Bull Dog | | Leading sire in America five times, most of them with Calumet Farm champions.
Citation | 1945 | Bull Lea | k us3 | Won the Triple Crown in 1948 and became the first horse to earn $1 million.
Radium | 1903 | Bend Or | |
Night Raid | 1918 | Radium | |
Phar Lap | 1926 | Night Raid | g k | Australia's great champion. Won 37 of 51 races, including the 1930 Melbourne Cup.
Bona Vista | 1889 | Bend Or | | Won the 2,000 Guineas in 1892.
Cyllene | 1895 | Bona Vista | | Sired four Derby winners.
Polymelus | 1902 | Cyllene | |
Phalaris | 1913 | Polymelus | k | A top sprinter. Through his sons and grandsons, most of today's sire lines pass through him.

Oxford | 1857 | Birdcatcher | |
Sterling | 1868 | Oxford | |
Isonomy | 1875 | Sterling | |
Isinglass | 1890 | Isonomy | uk3 | Won the English Triple Crown in 1893 and lost only one of his 12 races.
Star Shoot | 1898 | Isinglass | |
Sir Barton | 1916 | Star Shoot | k us3 | The first American Triple Crown winner, in 1919, before anyone called it that.
John o' Gaunt | 1901 | Isinglass | |
Swynford | 1907 | John o' Gaunt | | Won the 1910 St Leger.
Blandford | 1919 | Swynford | | Sired four Derby winners.
Bahram | 1932 | Blandford | uk3 | Unbeaten in nine races, including the 1935 English Triple Crown.
Blenheim | 1927 | Blandford | | Won the 1930 Derby.
Whirlaway | 1938 | Blenheim | k us3 | Won the Triple Crown in 1941.
Mahmoud | 1933 | Blenheim | | Won the 1936 Derby in record time.
St. Germans | 1921 | Swynford | |
Bold Venture | 1933 | St. Germans | | Won the 1936 Kentucky Derby and Preakness.
Assault | 1943 | Bold Venture | us3 | The "Club-Footed Comet", Triple Crown winner in 1946.

Camel | 1822 | Whalebone | |
Touchstone | 1831 | Camel | | Won the 1834 St Leger.
Newminster | 1848 | Touchstone | | Won the 1851 St Leger.
Lord Clifden | 1860 | Newminster | | Won the 1863 St Leger.
Hampton | 1872 | Lord Clifden | |
Bay Ronald | 1893 | Hampton | |
Bayardo | 1906 | Bay Ronald | |
Gainsborough | 1915 | Bayardo | uk3 | Won the English Triple Crown in 1918, run at Newmarket during the war.
Hyperion | 1930 | Gainsborough | k | A small chestnut who won the 1933 Derby and St Leger, then led the British sire list six times.
Aureole | 1950 | Hyperion | | Queen Elizabeth II's best horse, winner of the 1954 King George VI and Queen Elizabeth Stakes.
Khaled | 1943 | Hyperion | |
Swaps | 1952 | Khaled | | Won the 1955 Kentucky Derby.
Alibhai | 1938 | Hyperion | |
Your Host | 1947 | Alibhai | |
Kelso | 1957 | Your Host | g k | Horse of the Year five years running, 1960 to 1964.
Aristophanes | 1948 | Hyperion | |
Forli | 1963 | Aristophanes | | Unbeaten in seven races in Argentina.
Forego | 1970 | Forli | g | Horse of the Year three years running, 1974 to 1976.

King Fergus | 1775 | Eclipse | |
Hambletonian | 1792 | King Fergus | | Won the 1795 St Leger.
Whitelock | 1803 | Hambletonian | |
Blacklock | 1814 | Whitelock | |
Voltaire | 1826 | Blacklock | |
Voltigeur | 1847 | Voltaire | | Won the 1850 Derby and St Leger.
Vedette | 1854 | Voltigeur | | Won the 2,000 Guineas in 1857.
Galopin | 1872 | Vedette | | Won the 1875 Derby.
St. Simon | 1881 | Galopin | k | Unbeaten, then leading sire in Britain nine times.
Persimmon | 1893 | St. Simon | | Won the 1896 Derby for the Prince of Wales.
Prince Palatine | 1908 | Persimmon | |
Rose Prince | 1919 | Prince Palatine | |
Prince Rose | 1928 | Rose Prince | |
Princequillo | 1940 | Prince Rose | | Secretariat's grandfather on his mother's side.
Round Table | 1954 | Princequillo | | Won 43 races and was Horse of the Year in 1958.
Prince Blessed | 1957 | Princequillo | |
Ole Bob Bowers | 1963 | Prince Blessed | |
John Henry | 1975 | Ole Bob Bowers | g k | A cheap, bad-tempered gelding who won 39 races and was Horse of the Year at nine.
Rabelais | 1900 | St. Simon | |
Havresac | 1915 | Rabelais | |
Cavaliere d'Arpino | 1926 | Havresac | |
Bellini | 1937 | Cavaliere d'Arpino | |
Tenerani | 1944 | Bellini | |
Ribot | 1952 | Tenerani | k | Unbeaten in 16 races, including the Arc in 1955 and 1956.
Tom Rolfe | 1962 | Ribot | | Won the 1965 Preakness.
Hoist the Flag | 1968 | Tom Rolfe | |
Alleged | 1974 | Hoist the Flag | | Won the Arc in 1977 and 1978.
Speculum | 1865 | Vedette | |
Rosebery | 1872 | Speculum | |
Amphion | 1886 | Rosebery | |
Sundridge | 1898 | Amphion | |
Sunreigh | 1919 | Sundridge | |
Reigh Count | 1925 | Sunreigh | | Won the 1928 Kentucky Derby.
Count Fleet | 1940 | Reigh Count | us3 | Won the Triple Crown in 1943, taking the Belmont by 25 lengths.

Pharos | 1920 | Phalaris | |
Nearco | 1935 | Pharos | k | Unbeaten in 14 races in Italy. Most of the great modern sire lines come down through him.
Fairway | 1925 | Phalaris | | Won the 1928 St Leger.
Fair Trial | 1932 | Fairway | |
Petition | 1944 | Fair Trial | |
March Past | 1950 | Petition | |
Queen's Hussar | 1960 | March Past | |
Brigadier Gerard | 1968 | Queen's Hussar | k | Won 17 of 18 races, and beat Mill Reef in the 1971 2,000 Guineas.
Honeyway | 1941 | Fairway | |
Great Nephew | 1963 | Honeyway | |
Shergar | 1978 | Great Nephew | k | Won the 1981 Derby by ten lengths. Kidnapped from his stud in 1983 and never found.
Sickle | 1924 | Phalaris | | Went to America, where his line grew into the Native Dancer branch.
Unbreakable | 1935 | Sickle | |
Polynesian | 1942 | Unbreakable | | Won the 1945 Preakness.
Native Dancer | 1950 | Polynesian | k | The "Grey Ghost" of early television. Won 21 of 22 races, losing only the 1953 Kentucky Derby.
Dan Cupid | 1956 | Native Dancer | |
Sea-Bird | 1962 | Dan Cupid | k | Won the 1965 Derby and Arc, and was long rated the best horse of his era.
Raise a Native | 1961 | Native Dancer | | Unbeaten in four races before an injury ended his career.
Exclusive Native | 1965 | Raise a Native | |
Affirmed | 1975 | Exclusive Native | k us3 | Won the 1978 Triple Crown, beating Alydar in all three races.
Alydar | 1975 | Raise a Native | | Second to Affirmed in all three Triple Crown races, then the better stallion.
Alysheba | 1984 | Alydar | | Won the 1987 Kentucky Derby and the 1988 Breeders' Cup Classic.
Easy Goer | 1986 | Alydar | | Won the 1989 Belmont Stakes, denying Sunday Silence the Triple Crown.
Mr. Prospector | 1970 | Raise a Native | k | Fast, fragile and only a minor stakes winner, but one of the great stallions. Leading American sire in 1987 and 1988.
Pharamond | 1925 | Phalaris | |
Menow | 1935 | Pharamond | |
Tom Fool | 1949 | Menow | | Unbeaten in ten races in 1953.
Buckpasser | 1963 | Tom Fool | | Horse of the Year in 1966.
Tim Tam | 1955 | Tom Fool | | Won the 1958 Kentucky Derby and Preakness.

Nasrullah | 1940 | Nearco | k | Brilliant and hot-tempered. Moved to Kentucky in 1950 and became America's leading sire five times.
Bold Ruler | 1954 | Nasrullah | k | Leading sire in America eight times.
Secretariat | 1970 | Bold Ruler | k us3 | Won the 1973 Triple Crown and the Belmont by 31 lengths. Still holds the record time in all three races.
Boldnesian | 1963 | Bold Ruler | |
Bold Reasoning | 1968 | Boldnesian | |
Seattle Slew | 1974 | Bold Reasoning | k us3 | Won the Triple Crown in 1977, the first horse to do it unbeaten.
A.P. Indy | 1989 | Seattle Slew | k | Won the 1992 Belmont and Breeders' Cup Classic, then became a leading sire.
Pulpit | 1994 | A.P. Indy | |
Tapit | 2001 | Pulpit | | A grey who was America's leading sire in 2014, 2015 and 2016.
Flightline | 2018 | Tapit | k | Unbeaten in six races, ending with the 2022 Breeders' Cup Classic by eight and a quarter lengths.
Lucky Pulpit | 2001 | Pulpit | |
California Chrome | 2011 | Lucky Pulpit | k | His father stood for $2,500. He won the 2014 Kentucky Derby and Preakness and was Horse of the Year twice.
Malibu Moon | 1997 | A.P. Indy | |
Orb | 2010 | Malibu Moon | | Won the 2013 Kentucky Derby.
Never Bend | 1960 | Nasrullah | |
Mill Reef | 1968 | Never Bend | k | Won the Derby, the King George and the Arc in 1971.
Red God | 1954 | Nasrullah | |
Blushing Groom | 1974 | Red God | |
Nashwan | 1986 | Blushing Groom | | Won the 2,000 Guineas, Derby, Eclipse and King George in 1989.
Nashua | 1952 | Nasrullah | | Won the 1955 Preakness and Belmont, and beat Swaps in a match race.
Nearctic | 1954 | Nearco | |
Northern Dancer | 1961 | Nearctic | k | A small Canadian colt who won the 1964 Kentucky Derby and Preakness, then became the most influential stallion of the 20th century.
Royal Charger | 1942 | Nearco | |
Turn-To | 1951 | Royal Charger | |
Hail to Reason | 1958 | Turn-To | |
Halo | 1969 | Hail to Reason | |
Sunday Silence | 1986 | Halo | k | Beat Easy Goer in the 1989 Kentucky Derby and Preakness, then went to Japan and changed racing there.
Deep Impact | 2002 | Sunday Silence | k jp3 | Won the Japanese Triple Crown unbeaten in 2005, then led Japan's sire list for over a decade.
Contrail | 2017 | Deep Impact | jp3 | Won the Japanese Triple Crown unbeaten in 2020, fifteen years after his father.
Auguste Rodin | 2020 | Deep Impact | | Won the 2023 Derby at Epsom.
Real Steel | 2012 | Deep Impact | | Won the 2016 Dubai Turf.
Forever Young | 2021 | Real Steel | k | Won the 2025 Breeders' Cup Classic, the first Japanese-trained horse to do it.
Stay Gold | 1994 | Sunday Silence | |
Orfevre | 2008 | Stay Gold | jp3 | Won the Japanese Triple Crown in 2011, and was second in the Arc twice.
Black Tide | 2001 | Sunday Silence | |
Kitasan Black | 2012 | Black Tide | |
Equinox | 2019 | Kitasan Black | k | Rated the best racehorse in the world in 2023.
Roberto | 1969 | Hail to Reason | | Won the 1972 Derby, and handed Brigadier Gerard his only defeat.
Sir Gaylord | 1959 | Turn-To | |
Sir Ivor | 1965 | Sir Gaylord | | Won the 1968 2,000 Guineas and Derby.
Archive | 1941 | Nearco | |
Arkle | 1957 | Archive | g k | Probably the greatest steeplechaser ever. Won three Cheltenham Gold Cups in a row, 1964 to 1966.

Nijinsky | 1967 | Northern Dancer | k uk3 | Won the English Triple Crown in 1970, the last horse to do it.
Royal Academy | 1987 | Nijinsky | | Won the 1990 Breeders' Cup Mile.
Bel Esprit | 1999 | Royal Academy | |
Black Caviar | 2006 | Bel Esprit | m k | Unbeaten in 25 races, the great Australian sprinter.
Lammtarra | 1992 | Nijinsky | | Won the Derby, the King George and the Arc in 1995, in a career of four races.
Ferdinand | 1983 | Nijinsky | | Won the 1986 Kentucky Derby.
Sadler's Wells | 1981 | Northern Dancer | k | Leading sire in Britain and Ireland fourteen times.
Galileo | 1998 | Sadler's Wells | k | Won the 2001 Derby, then became the dominant stallion in Europe.
Frankel | 2008 | Galileo | k | Unbeaten in 14 races, ten of them Group 1s.
Adayar | 2018 | Frankel | | Won the 2021 Derby and King George.
Alpinista | 2017 | Frankel | m | Won the 2022 Prix de l'Arc de Triomphe.
Nathaniel | 2008 | Galileo | | Won the 2011 King George.
Enable | 2014 | Nathaniel | m k | Won the Arc in 2017 and 2018, and the King George three times.
Australia | 2011 | Galileo | | Won the 2014 Derby. His father won the Derby and his mother the Oaks.
Lambourn | 2022 | Australia | | Won the 2025 Derby at Epsom and the Irish Derby.
Montjeu | 1996 | Sadler's Wells | | Won the 1999 Arc, then sired four Derby winners.
Camelot | 2009 | Montjeu | | Won the 2012 2,000 Guineas and Derby, then just missed the Triple Crown in the St Leger.
Christmas Day | 2023 | Camelot | | Won the 2026 Derby at Epsom, his father's first Derby winner.
El Prado | 1989 | Sadler's Wells | |
Medaglia d'Oro | 1999 | El Prado | |
Rachel Alexandra | 2006 | Medaglia d'Oro | m | Beat the colts in the 2009 Preakness and was Horse of the Year.
Danzig | 1977 | Northern Dancer | k | Raced only three times, then became one of the most important sons of Northern Dancer.
Danehill | 1986 | Danzig | k | Covered mares in both hemispheres each year and became one of the most successful sires ever.
Rock of Gibraltar | 1999 | Danehill | | Won seven Group 1 races in a row in 2001 and 2002.
Fastnet Rock | 2001 | Danehill | |
Green Desert | 1983 | Danzig | |
Cape Cross | 1994 | Green Desert | |
Sea the Stars | 2006 | Cape Cross | k | Won the 2,000 Guineas, the Derby and the Arc in 2009.
Baaeed | 2018 | Sea the Stars | | Won his first ten races, including the 2022 Juddmonte International.
Daryz | 2022 | Sea the Stars | | Won the 2025 Prix de l'Arc de Triomphe by a head.
Golden Horn | 2012 | Cape Cross | | Won the Derby and the Arc in 2015.
Invincible Spirit | 1997 | Green Desert | |
Kingman | 2011 | Invincible Spirit | | Won four Group 1s in a row in 2014.
Storm Bird | 1978 | Northern Dancer | |
Storm Cat | 1983 | Storm Bird | k | For years the most expensive stallion in America, at $500,000 a mating.
Giant's Causeway | 1997 | Storm Cat | | The "Iron Horse": five Group 1 wins in a row in 2000.
Hennessy | 1993 | Storm Cat | |
Johannesburg | 1999 | Hennessy | |
Scat Daddy | 2004 | Johannesburg | |
Justify | 2015 | Scat Daddy | k us3 | Won the 2018 Triple Crown unbeaten, having never raced at two.
City of Troy | 2021 | Justify | | Won the 2024 Derby at Epsom.
Harlan | 1989 | Storm Cat | |
Harlan's Holiday | 1999 | Harlan | |
Into Mischief | 2005 | Harlan's Holiday | k | America's leading sire seven years running, 2019 to 2025, equalling Bold Ruler's record streak.
Authentic | 2017 | Into Mischief | | Won the 2020 Kentucky Derby, run in September that year, and the Breeders' Cup Classic.
Sovereignty | 2022 | Into Mischief | k | Won the 2025 Kentucky Derby, Belmont Stakes and Travers, and was Horse of the Year.
Vice Regent | 1967 | Northern Dancer | |
Deputy Minister | 1979 | Vice Regent | |
Awesome Again | 1994 | Deputy Minister | | Won the 1998 Breeders' Cup Classic.
Ghostzapper | 2000 | Awesome Again | | Won the 2004 Breeders' Cup Classic.
Lyphard | 1969 | Northern Dancer | |
Dancing Brave | 1983 | Lyphard | | Won the 1986 Arc with a famous late run.
Nureyev | 1977 | Northern Dancer | |
Miesque | 1984 | Nureyev | m | Won the Breeders' Cup Mile in 1987 and 1988.
The Minstrel | 1974 | Northern Dancer | | Won the 1977 Derby.
Palace Music | 1981 | The Minstrel | |
Cigar | 1990 | Palace Music | k | Won 16 races in a row in 1994 to 1996, matching Citation's record.

Fappiano | 1977 | Mr. Prospector | |
Unbridled | 1987 | Fappiano | | Won the 1990 Kentucky Derby and Breeders' Cup Classic.
Empire Maker | 2000 | Unbridled | | Won the 2003 Belmont Stakes.
Pioneerof the Nile | 2006 | Empire Maker | |
American Pharoah | 2012 | Pioneerof the Nile | k us3 | Ended a 37-year wait for a Triple Crown winner in 2015, then won the Breeders' Cup Classic too.
Unbridled's Song | 1993 | Unbridled | |
Arrogate | 2013 | Unbridled's Song | | Won the 2016 Travers in record time, the Breeders' Cup Classic and the 2017 Dubai World Cup.
Cryptoclearance | 1984 | Fappiano | |
Ride the Rails | 1991 | Cryptoclearance | |
Candy Ride | 1999 | Ride the Rails | | Unbeaten in Argentina and America.
Gun Runner | 2013 | Candy Ride | k | Won the 2017 Breeders' Cup Classic, then became one of America's top sires.
Quiet American | 1986 | Fappiano | |
Real Quiet | 1995 | Quiet American | | Won the 1998 Kentucky Derby and Preakness, and lost the Belmont by a nose.
Kingmambo | 1990 | Mr. Prospector | |
King Kamehameha | 2001 | Kingmambo | | Won the 2004 Japanese Derby.
Lord Kanaloa | 2008 | King Kamehameha | | Won the Hong Kong Sprint in 2012 and 2013.
Almond Eye | 2015 | Lord Kanaloa | m k | Won nine Group 1 races, a record for a Japanese horse.
Machiavellian | 1987 | Mr. Prospector | |
Street Cry | 1998 | Machiavellian | | Won the 2002 Dubai World Cup. Father of both Zenyatta and Winx.
Zenyatta | 2004 | Street Cry | m k | Won her first 19 races, including the 2009 Breeders' Cup Classic.
Winx | 2011 | Street Cry | m k | Won 33 races in a row in Australia, including four Cox Plates.
Street Sense | 2004 | Street Cry | | Won the 2007 Kentucky Derby.
Smart Strike | 1992 | Mr. Prospector | |
Curlin | 2004 | Smart Strike | k | Horse of the Year in 2007 and 2008.
Good Magic | 2015 | Curlin | | Won the 2017 Breeders' Cup Juvenile.
Mage | 2020 | Good Magic | | Won the 2023 Kentucky Derby.
Golden Tempo | 2023 | Curlin | | Won the 2026 Kentucky Derby at 23-1, the first Derby winner trained by a woman, Cherie DeVaux. Then won the Belmont.
Seeking the Gold | 1985 | Mr. Prospector | |
Dubai Millennium | 1996 | Seeking the Gold | | Won the 2000 Dubai World Cup by six lengths.
Forty Niner | 1985 | Mr. Prospector | |
Distorted Humor | 1993 | Forty Niner | |
Funny Cide | 2000 | Distorted Humor | g | A New York-bred gelding who won the 2003 Kentucky Derby and Preakness.
Fusaichi Pegasus | 1997 | Mr. Prospector | | Won the 2000 Kentucky Derby.
`;

// Typographer's quotes for display: Man o’ War, “Eclipse first”.
const curly = s => s.replace(/"([^"]*)"/g, '\u201c$1\u201d').replace(/'/g, '\u2019');

export const HORSES = DATA.trim().split('\n').filter(line => line.trim()).map(line => {
  const [name, year, sire, tags, note] = line.split('|').map(s => curly(s.trim()));
  return { name, year: +year, sire: sire || null, tags: tags ? tags.split(/\s+/) : [], note: note || '' };
});
