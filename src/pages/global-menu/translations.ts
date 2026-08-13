import type { MenuItem } from "./data";
import type { MenuLocale } from "./locales";
import { westernTranslations } from "./western-translations";
import { arabicTranslations } from "./arabic";
import { extendedMenuPart1 } from "./extended-menu";
import { extendedMenuPart2 } from "./extended-menu-2";
import { extendedMenuPart3 } from "./extended-menu-3";

export type MenuCopy={name:string;description?:string;ingredients?:string;option?:string};
export type StoryCopy={eyebrow:string;title:string;paragraphs:string[]};
const ids=["abalone-paella","iberico-steak","pulpo","honey-cod","tortilla","iberico-stew","albondigas","gambas","patatas-bravas","croquetas","champinones","calamares","honey-eggplant","baked-eggplant","burrata","ensaladilla","cheesecake","sangria-bottle","sangria-glass","estrella","house-wine","sparkling-water","soft-drink"];
type Row=[string,string?,string?,string?];
const make=(values:Row[])=>Object.fromEntries(ids.map((id,i)=>[id,{name:values[i][0],description:values[i][1],ingredients:values[i][2],option:values[i][3]}])) as Record<string,MenuCopy>;

export const stories:Record<MenuLocale,StoryCopy>={
ko:{eyebrow:"OUR STORY",title:"광명에서 시작한 스페인의 맛",paragraphs:["RIORIO의 ‘Rio’는 스페인어로 강을 뜻합니다. 그리고 강씨 형제의 성에서 시작된 이름이기도 합니다.","우리가 나고 자란 광명에서, 우리가 좋아하는 스페인의 맛을 우리 방식으로 전하고 싶었습니다. 스페인 요리의 뿌리는 존중하되, 익숙한 재료와 우리의 감각을 더해 리오리오만의 한 접시를 만듭니다.","그 시작을 가장 잘 보여주는 요리가 전복 빠에야입니다. 스페인의 빠에야에 한국의 좋은 쌀과 전복, 그리고 리오리오의 K-Touch를 더했습니다.","익숙하지 않은 스페인 요리도 편하게 즐길 수 있도록, 리오리오의 방식으로 풀어냅니다."]},
en:{eyebrow:"OUR STORY",title:"Spanish flavors, born in Gwangmyeong",paragraphs:["RIORIO takes its name from río, the Spanish word for ‘river,’ and from the Kang brothers’ family name. We started in Gwangmyeong, where we grew up, to make Spanish food feel closer and more welcoming.","Our signature Abalone Paella begins with the flavors of Spain and adds RIORIO’s own K-Touch. Rather than simply following tradition, it is our paella—finished with the tastes and methods we love."]},
ja:{eyebrow:"私たちの物語",title:"光明から始まったスペインの味",paragraphs:["RIORIOの「Rio」は、スペイン語で「川」を意味します。そして、カン兄弟の姓から生まれた名前でもあります。","私たちが生まれ育った光明で、大好きなスペインの味を自分たちの方法で伝えたいと思いました。スペイン料理のルーツを尊重しながら、親しみのある食材と私たちの感性を加え、RIORIOだけの一皿を作ります。","その始まりを最もよく表す料理が、アワビのパエリアです。スペインのパエリアに韓国のおいしい米とアワビ、そしてRIORIOのK-Touchを加えました。","スペインをそのまま再現するのではなく、光明で私たちが解釈したスペインをお届けします。"]},
"zh-CN":{eyebrow:"我们的故事",title:"始于光明的西班牙风味",paragraphs:["RIORIO这个名字，源自西班牙语中意为“河流”的Rio，也源自姜氏兄弟的姓氏。我们希望在出生长大的光明，让大家更轻松、更亲近地品尝西班牙料理。","招牌鲍鱼海鲜饭以西班牙风味为基础，融入RIORIO独有的K-Touch。我们不拘泥于复刻传统，而是用自己喜爱的味道与方式，完成属于RIORIO的海鲜饭。"]},
"zh-TW":{eyebrow:"我們的故事",title:"從光明開始的西班牙風味",paragraphs:["RIORIO的名字源自西班牙語中意為「河流」的Rio，也來自姜氏兄弟的姓氏。我們希望在出生長大的光明，讓大家更輕鬆地享用西班牙料理。","招牌鮑魚海鮮飯以西班牙風味為基礎，加入RIORIO獨有的K-Touch，以我們喜愛的味道與方式完成。"]},
es:{eyebrow:"NUESTRA HISTORIA",title:"Sabores de España nacidos en Gwangmyeong",paragraphs:["RIORIO nace de río, la palabra española, y del apellido de los hermanos Kang. Empezamos en Gwangmyeong, donde crecimos, para acercar la cocina española de forma acogedora.","Nuestra paella de abulón combina los sabores de España con el K-Touch propio de RIORIO y los métodos que nos gustan."]},
"es-419":{eyebrow:"NUESTRA HISTORIA",title:"Sabores de España nacidos en Gwangmyeong",paragraphs:["RIORIO nace de río y del apellido de los hermanos Kang. Comenzamos en Gwangmyeong para acercar la cocina española de manera sencilla y acogedora.","Nuestra paella de abulón combina sabores de España con el K-Touch propio de RIORIO."]},
fr:{eyebrow:"NOTRE HISTOIRE",title:"Les saveurs d’Espagne nées à Gwangmyeong",paragraphs:["RIORIO vient de río, « rivière » en espagnol, et du nom des frères Kang. À Gwangmyeong, où nous avons grandi, nous souhaitons rendre la cuisine espagnole plus proche et conviviale.","Notre paella aux ormeaux associe les saveurs d’Espagne au K-Touch propre à RIORIO."]},
pt:{eyebrow:"A NOSSA HISTÓRIA",title:"Sabores de Espanha nascidos em Gwangmyeong",paragraphs:["RIORIO nasce de río, «rio» em espanhol, e do apelido dos irmãos Kang. Começámos em Gwangmyeong para aproximar a cozinha espanhola.","A nossa paella de abalone junta sabores de Espanha ao K-Touch da RIORIO."]},
"pt-BR":{eyebrow:"NOSSA HISTÓRIA",title:"Sabores da Espanha nascidos em Gwangmyeong",paragraphs:["RIORIO vem de río, “rio” em espanhol, e do sobrenome dos irmãos Kang. Começamos em Gwangmyeong para aproximar a culinária espanhola.","Nossa paella de abalone combina sabores da Espanha com o K-Touch da RIORIO."]},
de:{eyebrow:"UNSERE GESCHICHTE",title:"Spanische Aromen aus Gwangmyeong",paragraphs:["RIORIO verbindet río, das spanische Wort für „Fluss“, mit dem Familiennamen der Kang-Brüder. In Gwangmyeong möchten wir spanische Küche näher und zugänglicher machen.","Unsere Abalone-Paella verbindet spanische Aromen mit RIORIOs eigenem K-Touch."]},
it:{eyebrow:"LA NOSTRA STORIA",title:"Sapori di Spagna nati a Gwangmyeong",paragraphs:["RIORIO nasce da río, “fiume” in spagnolo, e dal cognome dei fratelli Kang. A Gwangmyeong rendiamo la cucina spagnola più vicina e accogliente.","La nostra paella all’abalone unisce i sapori di Spagna al K-Touch di RIORIO."]},
hi:{eyebrow:"हमारी कहानी",title:"ग्वांगम्योंग से शुरू हुआ स्पेनिश स्वाद",paragraphs:["RIORIO नाम स्पेनिश शब्द Rio, यानी ‘नदी’, और कांग भाइयों के पारिवारिक नाम से बना है। हमने ग्वांगम्योंग में स्पेनिश भोजन को अधिक सहज बनाने के लिए शुरुआत की।","हमारी खास एबालोन पायेया में स्पेन के स्वाद के साथ RIORIO का अपना K-Touch है।"]},
ar:{eyebrow:"قصتنا",title:"نكهات إسبانيا التي بدأت في غوانغميونغ",paragraphs:["يأتي اسم RIORIO من كلمة Rio، التي تعني «النهر» بالإسبانية، ومن اسم عائلة الأخوين كانغ. بدأنا في غوانغميونغ، المدينة التي نشأنا فيها، لنقرّب المطبخ الإسباني بطريقة مريحة ومرحّبة.","تحترم أطباقنا جذور المطبخ الإسباني، وتضيف مكونات مألوفة ولمسة RIORIO الخاصة. وتعبّر باييّا الأبالون المميزة عن هذه البداية، بأرز كوري جيد وأبالون وK-Touch الخاص بنا."]}
};

export const globalClosing:Record<MenuLocale,string>={ko:"익숙하지 않은 스페인 요리도 편하게 즐길 수 있도록, 리오리오의 방식으로 풀어냅니다.",en:"We interpret Spanish cuisine in the RIORIO way, so even unfamiliar dishes feel easy and welcoming to enjoy.",ja:"馴染みのないスペイン料理も気軽に楽しめるよう、RIORIOならではの方法で表現しています。","zh-CN":"为了让不熟悉的西班牙料理也能轻松享用，我们以RIORIO自己的方式进行诠释。","zh-TW":"為了讓不熟悉的西班牙料理也能輕鬆享用，我們以RIORIO自己的方式加以詮釋。",es:"Interpretamos la cocina española al estilo RIORIO para que incluso los platos menos conocidos se disfruten con facilidad.","es-419":"Interpretamos la cocina española al estilo RIORIO para que incluso los platos menos conocidos se disfruten con facilidad.",fr:"Nous interprétons la cuisine espagnole à la manière de RIORIO afin que même les plats moins familiers soient faciles à apprécier.",pt:"Interpretamos a cozinha espanhola à maneira da RIORIO para que até os pratos menos familiares sejam fáceis de apreciar.","pt-BR":"Interpretamos a culinária espanhola do jeito RIORIO para que até os pratos menos conhecidos sejam fáceis de aproveitar.",de:"Wir interpretieren spanische Küche auf RIORIO-Art, damit auch weniger bekannte Gerichte unkompliziert genossen werden können.",it:"Interpretiamo la cucina spagnola nello stile RIORIO, affinché anche i piatti meno conosciuti siano facili da apprezzare.",hi:"हम स्पेनिश व्यंजनों को RIORIO के अंदाज़ में पेश करते हैं, ताकि अनजाने व्यंजनों का भी सहजता से आनंद लिया जा सके।",ar:"نقدّم المطبخ الإسباني بأسلوب RIORIO حتى يسهل الاستمتاع بالأطباق غير المألوفة أيضاً."};

const ja=make([
["シグネチャー アワビのパエリア","（2～2.5人前）莞島産アワビの深い海の香りを込めたRIORIOのシグネチャーパエリア","莞島産アワビ · 新東津米 · エビ · イカ"],
["ベジョータ100%イベリコステーキ","どんぐりだけで育ったイベリコ豚を低温調理し、やわらかく焼き上げた肩ロースステーキ","イベリコ・ベジョータ肩ロース · ポテトピューレ · りんごピューレ"],
["Pulpo a la Gallega","コンフィ調理と200時間の熟成で驚くほどやわらかく仕上げたガリシア風タコ料理","タコ · じゃがいも · ほうれん草 · トマト"],
["ハニーコッド","スペイン風ピストにタラ、蜂蜜、アイオリを合わせ、直火で香りを引き出した一皿","タラ · ピスト · アイオリ · 蜂蜜"],
["Tortilla Española","（2～3人前）じゃがいもと卵をじっくり火入れしたスペインの家庭風オムレツ","じゃがいも · 卵 · ほうれん草 · 玉ねぎ · イベリコ・ベジョータのパンチェッタ"],
["イベリコシチュー","やわらかく煮込んだイベリコ豚と野菜を濃厚なトマトソースで仕上げたスペイン風シチュー","イベリコ・ベジョータ · トマト · 新鮮な野菜"],
["Albóndigas","ジューシーなミートボールを濃厚なスペイン風ピストと味わう料理","韓国産豚肉 · 牛肉 · ルッコラ · ピスト"],
["Gambas al Ajillo","エビとにんにくのコンフィオイルに、やわらかな豆腐餅を添えたスペインのタパス","エビ · 絹ごし豆腐 · にんにくコンフィ · エクストラバージンオリーブオイル"],
["Patatas Bravas","カリカリのポテトに辛いブラバソースとまろやかなアイオリを添えた代表的なタパス","じゃがいも · サルサブラバ · アイオリ"],
["エビのクロケタス","エビのベシャメルを香ばしく揚げた一口サイズのスペイン風クロケタス · 3個","エビのベシャメル","5個"],
["Champiñones","マッシュルームと生クリームのソースで風味を高めた特選グリルマッシュルーム · 7個","マッシュルーム · えのき · イベリコ・ベジョータのパンチェッタ · クリームソース · 黒トリュフオイル"],
["Calamares Fritos","イカ墨の衣で揚げたマドリード風イカフライ","イカ · イカ墨 · アイオリ · レモン"],
["蜂蜜ナスフライ","揚げナスにRIORIO特製の蜂蜜ソースを添えた、店主お気に入りのタパス","ナス · 蜂蜜 · ホワイトバルサミコ"],
["スペイン風焼きナス","スペイン風ラグーを詰めた家庭的な焼きナス","ナス · スペイン風ラグー · トマト · パプリカ · モッツァレラ · ルッコラ"],
["ブッラータチーズサラダ","新鮮なブッラータにホワイトバルサミコと白トリュフのガーリックドレッシングを合わせたサラダ","ブッラータ · ルッコラ · 海藻 · 海ぶどう · 白トリュフオイル · ホワイトバルサミコ"],
["Ensaladilla Rusa","じゃがいもと野菜をコクのあるマヨネーズで和えたスペイン風サラダ","じゃがいも · 卵 · ツナ · 野菜"],
["ブルーベリー・バスクチーズケーキ","北スペイン風バスクチーズケーキに、ワイン香る自家製ブルーベリージャムを添えました","生クリーム · 卵 · クリームチーズ · ブルーベリー · 赤ワイン","パン追加 · 5個"],
["サングリア ボトル","赤ワインに果物を漬け込んで香りを引き出した、スペインを代表するワインカクテル","ライム · レモン · オレンジ · りんご · スペイン産ブランデー"],
["サングリア グラス","赤ワインに果物を漬け込んで香りを引き出した、スペインを代表するワインカクテル","ライム · レモン · オレンジ · りんご · スペイン産ブランデー"],
["バルセロナ エストレージャ・ダム 生ビール","心地よい炭酸と穀物の香り、すっきりした後味を楽しめるバルセロナを代表するラガー"],
["ハウスワイン（赤／白）","赤はやわらかな果実味、白は爽やかな酸味を気軽に楽しめるデイリーワイン"],
["炭酸水"],
["ソフトドリンク","ペプシゼロ、コカ・コーラ、スプライト"]]);

const zhCN=make([
["鲍鱼海鲜饭","（2～2.5人份）以莞岛鲍鱼的深邃海洋风味呈现RIORIO招牌海鲜饭","莞岛鲍鱼 · 新东津米 · 虾 · 鱿鱼"],["100%贝约塔伊比利亚猪排","橡果饲养的伊比利亚黑猪经低温慢煮后烤制，口感柔嫩","伊比利亚猪颈肉 · 土豆泥 · 苹果泥"],["Pulpo a la Gallega 加利西亚章鱼","经油封烹调并熟成200小时，口感极致柔嫩","章鱼 · 土豆 · 菠菜 · 番茄"],["蜂蜜鳕鱼","鳕鱼配西班牙蔬菜炖酱、蜂蜜和蒜味蛋黄酱，经明火炙烤提香","鳕鱼 · Pisto · 蒜味蛋黄酱 · 蜂蜜"],["Tortilla Española 西班牙土豆蛋饼","（2～3人份）土豆与鸡蛋慢火烹制的西班牙家常蛋饼","土豆 · 鸡蛋 · 菠菜 · 洋葱 · 伊比利亚培根"],["伊比利亚猪肉炖菜","伊比利亚猪肉与蔬菜慢炖于浓郁番茄酱中","伊比利亚猪肉 · 番茄 · 新鲜蔬菜"],["Albóndigas 西班牙肉丸","多汁肉丸搭配浓郁的西班牙Pisto蔬菜炖酱","猪肉 · 牛肉 · 芝麻菜 · Pisto"],["Gambas al Ajillo 蒜香虾","虾与大蒜油封提香，搭配嫩豆腐年糕","虾 · 嫩豆腐 · 油封大蒜 · 特级初榨橄榄油"],["Patatas Bravas 香辣土豆","酥脆炸土豆配香辣Brava酱与蒜味蛋黄酱","土豆 · Salsa Brava · 蒜味蛋黄酱"],["虾肉可乐饼","虾肉白酱制成的一口大小西班牙可乐饼 · 3个","虾肉白酱","5个"],["Champiñones 烤蘑菇","精选蘑菇搭配浓郁奶油酱 · 7个","蘑菇 · 金针菇 · 伊比利亚培根 · 奶油酱 · 黑松露油"],["Calamares Fritos 炸鱿鱼","以墨鱼汁面糊炸制的马德里风味鱿鱼","鱿鱼 · 墨鱼汁 · 蒜味蛋黄酱 · 柠檬"],["蜂蜜炸茄子","炸茄子搭配RIORIO特制蜂蜜酱","茄子 · 蜂蜜 · 白香醋"],["西班牙烤茄子","填入西班牙肉酱的家常烤茄子","茄子 · 西班牙肉酱 · 番茄 · 甜椒 · 马苏里拉 · 芝麻菜"],["布拉塔奶酪沙拉","新鲜布拉塔搭配白香醋和白松露蒜香酱汁","布拉塔 · 芝麻菜 · 海藻 · 海葡萄 · 白松露油 · 白香醋"],["Ensaladilla Rusa 土豆沙拉","土豆与蔬菜拌入香浓蛋黄酱的西班牙式沙拉","土豆 · 鸡蛋 · 金枪鱼 · 蔬菜"],["蓝莓巴斯克芝士蛋糕","北西班牙风味芝士蛋糕，配自制红酒蓝莓酱","淡奶油 · 鸡蛋 · 奶油奶酪 · 蓝莓 · 红酒","加面包 · 5个"],["桑格利亚 一瓶","红酒浸渍水果制成的西班牙经典鸡尾酒","青柠 · 柠檬 · 橙子 · 苹果 · 西班牙白兰地"],["桑格利亚 一杯","红酒浸渍水果制成的西班牙经典鸡尾酒","青柠 · 柠檬 · 橙子 · 苹果 · 西班牙白兰地"],["巴塞罗那星牌生啤","气泡清爽、谷物香气柔和、收口干净的拉格啤酒"],["店酒（红／白）","红酒果味柔和，白酒酸度清新"],["气泡水"],["软饮","百事可乐无糖、可口可乐、雪碧"]]);

const zhTW=make(zhCN ? [
["鮑魚海鮮飯","（2～2.5人份）以莞島鮑魚的深邃海洋風味呈現RIORIO招牌海鮮飯","莞島鮑魚 · 新東津米 · 蝦 · 魷魚"],["100%貝約塔伊比利豬排","橡果飼養的伊比利黑豬經低溫慢煮後烤製，口感柔嫩","伊比利豬頸肉 · 馬鈴薯泥 · 蘋果泥"],["Pulpo a la Gallega 加利西亞章魚","經油封烹調並熟成200小時，口感極致柔嫩","章魚 · 馬鈴薯 · 菠菜 · 番茄"],["蜂蜜鱈魚","鱈魚配西班牙燉蔬菜、蜂蜜和蒜味蛋黃醬，經直火炙烤提香","鱈魚 · Pisto · 蒜味蛋黃醬 · 蜂蜜"],["Tortilla Española 西班牙馬鈴薯蛋餅","（2～3人份）馬鈴薯與雞蛋慢火烹製的西班牙家常蛋餅","馬鈴薯 · 雞蛋 · 菠菜 · 洋蔥 · 伊比利培根"],["伊比利豬肉燉菜","伊比利豬肉與蔬菜慢燉於濃郁番茄醬中","伊比利豬肉 · 番茄 · 新鮮蔬菜"],["Albóndigas 西班牙肉丸","多汁肉丸搭配濃郁的Pisto燉蔬菜","豬肉 · 牛肉 · 芝麻葉 · Pisto"],["Gambas al Ajillo 蒜香蝦","蝦與大蒜油封提香，搭配嫩豆腐年糕","蝦 · 嫩豆腐 · 油封大蒜 · 特級初榨橄欖油"],["Patatas Bravas 香辣馬鈴薯","酥脆炸馬鈴薯配Brava醬與蒜味蛋黃醬","馬鈴薯 · Salsa Brava · 蒜味蛋黃醬"],["鮮蝦可樂餅","鮮蝦白醬製成的一口大小可樂餅 · 3個","鮮蝦白醬","5個"],["Champiñones 烤蘑菇","精選蘑菇搭配濃郁奶油醬 · 7個","蘑菇 · 金針菇 · 伊比利培根 · 奶油醬 · 黑松露油"],["Calamares Fritos 炸魷魚","以墨魚汁麵糊炸製的馬德里風味魷魚","魷魚 · 墨魚汁 · 蒜味蛋黃醬 · 檸檬"],["蜂蜜炸茄子","炸茄子搭配RIORIO特製蜂蜜醬","茄子 · 蜂蜜 · 白香醋"],["西班牙烤茄子","填入西班牙肉醬的家常烤茄子","茄子 · 西班牙肉醬 · 番茄 · 甜椒 · 莫札瑞拉 · 芝麻葉"],["布拉塔起司沙拉","新鮮布拉塔搭配白香醋和白松露蒜香醬汁","布拉塔 · 芝麻葉 · 海藻 · 海葡萄 · 白松露油 · 白香醋"],["Ensaladilla Rusa 馬鈴薯沙拉","馬鈴薯與蔬菜拌入香濃美乃滋","馬鈴薯 · 雞蛋 · 鮪魚 · 蔬菜"],["藍莓巴斯克起司蛋糕","北西班牙風味起司蛋糕，配自製紅酒藍莓醬","鮮奶油 · 雞蛋 · 奶油起司 · 藍莓 · 紅酒","加麵包 · 5個"],["桑格利亞 一瓶","紅酒浸漬水果製成的西班牙經典調酒","萊姆 · 檸檬 · 柳橙 · 蘋果 · 西班牙白蘭地"],["桑格利亞 一杯","紅酒浸漬水果製成的西班牙經典調酒","萊姆 · 檸檬 · 柳橙 · 蘋果 · 西班牙白蘭地"],["巴塞隆納星牌生啤","氣泡清爽、穀物香氣柔和、收尾乾淨的拉格啤酒"],["店酒（紅／白）","紅酒果味柔和，白酒酸度清新"],["氣泡水"],["軟性飲料","百事可樂無糖、可口可樂、雪碧"]] : []);

const base=(items:MenuItem[],key:"ko"|"en")=>Object.fromEntries(items.map(i=>[i.id,{...i[key],option:key==="ko"?i.option?.labelKo:i.option?.labelEn}]));
export const translationsFor=(items:MenuItem[])=>{const ko=base(items,"ko");const en=base(items,"en");ko["abalone-paella"].name="시그니처 전복 빠에야";en["abalone-paella"].name="Signature Abalone Paella";zhCN["abalone-paella"].name="招牌鲍鱼海鲜饭";zhTW["abalone-paella"].name="招牌鮑魚海鮮飯";return{ko,en,ja,"zh-CN":zhCN,"zh-TW":zhTW,...westernTranslations,...extendedMenuPart1(items),...extendedMenuPart2(items),...extendedMenuPart3(items),ar:arabicTranslations} as Record<MenuLocale,Record<string,MenuCopy>>;};
