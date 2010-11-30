<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" xml:lang="en-US" lang="en-US">
<head>
  <meta http-equiv="Content-Type"
 content="text/html; charset=UTF-8" />
  <link rel="stylesheet" href="styles/myanmar-converter-extension.css" type="text/css" />
  <title>Myanmar Converter Firefox Extension</title>
  <style type="text/css">
  *[@lang='my'] { font-family: Padauk, Myanmar3; }
  body {background: #fffff0; }
  div#body { margin-left: 100px; }
  h1,h2,h3,h4,h5 {
  border-top-width: 0.1em;
  border-bottom-width: 0.1em;
  border-top-style: none;
  border-bottom-style: solid;
  color:  #c07000;
}
h1 { font-size: 16pt; padding-top: 0px; }
h2 { font-size: 14pt; }
h3 { font-size: 13pt; }
h4 { font-size: 12pt; }
h5 { font-size: 12pt; }

.centre {
  text-align: center;
}

.enTranslation {
	width: 45%;
	display: inline-block;
	vertical-align: top;
	margin-right: 1%;
}

h2.myTranslation, h3.myTranslation { font-weight: bold; }

.myTranslation {
	width: 45%;
	display: inline-block;
	font-family: ThanLwin, Padauk, Myanmar3, Parabaik;
	vertical-align: top;	
	margin-left: 1%;
}

  </style>
   <?php
  include('../ThanLwinSoft/_shared/DownloadList.php');
  ?>
</head>
<body>
<a href="http://thanlwinsoft.co.uk/" title="ThanLwinSoft" style="float:left;"><img src="images/ThanLwin.jpg" alt="ThanLwinSoft" /></a>
<div id="body">
<h1 class="enTranslation">Myanmar Converter Firefox Extension</h1>
<h1 lang="my" class="myTranslation">Firefox ကိုတိုးချဲ့အထူးပြုထားသောမြန်မာစာပြောင်းလဲခြင်း</h1>

<h2 class="enTranslation">What does it do?</h2>
<h2 lang="my" class="myTranslation">သူကဘာလုပ်လဲ?</h2>
<p class="enTranslation">
This extension automatically detects if a web page is using Zaw Gyi One fonts and converts the text to Unicode.
This means that you only need to install a Unicode font, you don't need to have ZawGyi installed.
</p>
<p lang="my" class="myTranslation">
web page တစ်ခုက စကားလုံးများကို ဇော်ဂျီဖောင့်ဖြင့် အသုံးပြုရေးသားထားလျှင် ဤတိုးချဲ့အထူးပြုချက်က ယူနီကုတ်သို့ အလိုအ​​လျောက် ရှာဖွေပြောင်းလဲပေးနိုင်သည်။ ထိုကြောင့် သင်သည် ယူနီကုတ်ဖောင့်ကိုသား ထည့်သွင်းရန်လိုအပ်ပြီး၊ ဇော်ဂျီဖောင့်ကို ထည့်သွင်းရန်လုံးဝမလိုအပ်ပါဟုဆိုလိုခြင်းပင်ဖြစ်သည်။
</p>

<h2 class="enTranslation">Requirements</h2>
<h2 lang="my" class="myTranslation">လိုအပ်ချက်များ</h2>
<ul>
<li class="enTranslation">A Myanmar Unicode font to be installed such as <a href="http://scripts.sil.org/Padauk">Padauk</a> or Myanmar3.</li>
<li lang="my" class="myTranslation">ဤကဲ့သို့သောမြန်မာယူနီကုတ်ဖောင့်များ၊ ဥပမာ <a href="http://scripts.sil.org/Padauk">ပိတောက်</a> သို့မဟုက် မြန်မာ-၃ ဖောင့်များ ထည့်သွင်းအသုံးပြု၍ရပါသည်။</li>
</ul>

<h2 class="enTranslation">Why convert from ZawGyi to Unicode?</h2>
<h2 lang="my" class="myTranslation">ဘာလို့ ဇော်ဂျီကနေ ယူနီကုတ်ကို ပြောင်းတာလဲ?</h2>
<p class="enTranslation">
Having both ZawGyi and Unicode fonts causes problems when the font is not explicitly defined by the web page.
If the wrong font is selected, then the Myanmar text will display wrongly. 
Unicode has many advantages over Zaw Gyi:
</p>
<p lang="my" class="myTranslation">
ဇော်ဂျီဖောင့်နှင့်ယူနီကုတ်ဖောင့် နှစ်ခုလုံးရှိနေသောအခါ web pageအနေဖြင့် မည်သည့်ဖောင့်ဆိုတာကို ပြတ်သားစွာ မဖော်ပြနိုင်တဲ့ ပြဿနာများကို ဖြစ်စေနိုင်ပါသည်။ မှားယွင်းတဲ့ ဖောင့်ကို​ရွေးချယ်မိခဲ့မယ်ဆိုလျှင်ဖြင့် မြန်မာစာလုံးများသည်လည်း မှန်ကန်စွာ ဖေါ်ပြနိုင်တော့မည်မဟုတ်ပေ။ ယူနီကုတ်တွင် ဇော်ဂျီထက်သာလွန်သော အကျိုးကျေးဇူးများရှိပေသည်။
</p>
<ul class="enTranslation">
<li>Unicode has only one spelling for a Myanmar word, Zaw Gyi can have multiple spellings for the same word.</li>
<li>Sorting and searching are much easier with Unicode.</li>
<li>Localized software will use Unicode.</li>
<li>Myanmar spell checking becomes possible with Unicode.</li>
<li>Mon, Karen, Shan can be displayed correctly with Unicode.</li>
</ul>
<ul lang="my" class="myTranslation">
<li>မြန်မာစကားလုံး တစ်လုံးအတွက် ယူနီကုတ်တွင် စာလုံးပေါင်းပုံ တစ်မျိုးတည်းသာ ရှိပါသည်။ တူညီတဲ့ စကားလုံးအတွက်ဇော်ဂျီတွင် စာလုံးပေါင်းပုံများ အများအပြား ရှိနိုင်ပါသည်။</li>
<li>ယူနီကုတ်ဖြင့် အမျိုးအစားခွဲခြင်း၊ ရှာဖွေခြင်းတွေကို လွယ်ကူစွာလုပ်​ဆောင်နိုင်ပါသည်။</li>
<li>နိုင်ငံတကာအဆင့်မှီဆော့ဝဲလ်တွင် ယူနီကုတ်ကိုသာ အသုံးပြုပါသည်။ </li>
<li>ယူနီကုတ်ဖြင့် မြန်မာစာ စာလုံးပေါင်းသတ်ပုံ စစ်ဆေးခြင်းများ ဖြစ်လာနိုင်ဖွယ်ရှိပါသည်။</li>
<li>ယူနီကုတ်ဖြင့် မွန်၊ ကရင်၊ ရှမ်း စကားလုံးများကို မှန်ကန်စွာ ပြသနိုင်ပါသည်။</li>
</ul>
<h2 class="enTranslation">Install</h2>
<h2 lang="my" class="myTranslation">ထည့်သွင်းသည်</h2>
<?php
$dir = new DownloadList("/var/www/MyanmarConverter/","/MyanmarConverter");
$dir->listDir();
?>
<h2 class="enTranslation">Usage</h2>
<h2 lang="my" class="myTranslation">အသုံးပြုပုံ</h2>
<p class="enTranslation">
Many web pages are using ZawGyi-One or other fonts which are not following the Unicode Standard correctly. The "Myanmar Converter" Firefox Extension allows people with only genuine Myanmar Unicode fonts installed to read these pages by converting the text to Unicode when the page opens.
</p>
<p lang="my" class="myTranslation">
web page ​တော်တော်များများဟာ ယူနီကုတ်အဆင့်အတန်းကို မှန်ကန်စွာမလိုက်နာတဲ့ ဇော်ဂျီ သို့မဟုတ် အခြားဖောင့် များကို အသုံးပြုနေကြပါတယ်။ Firefox ကိုတိုးချဲ့အထူးပြုထားသော မြန်မာစာပြောင်းလဲခြင်း (The "Myanmar Converter" Firefox Extension) ဟာ အစစ်အမှန်ဖြစ်သော မြန်မာယူနီကုတ်ဖောင့် တစ်မျိုးတည်းကိုသာ ထည့်သွင်းအသုံးပြုထားသော သူများအတွက် ဤစာမျက်နှာများကို ဖတ်ရှုနိုင်ရန် စာမျက်နှာဖွင့်လိုက်သောအခါ စာသားများကို ယူနီကုတ်သို့ ပြောင်းလဲပေးခြင်းအားဖြင့် ခွင့်ပြုထားပါတယ်။
</p>
<p class="enTranslation">
The Myanmar text will display wrongly like this:
</p>
<p lang="my" class="myTranslation">
မြန်မာစာလုံးတွေဟာ ဤကဲ့သို့ မှားယွင်းစွာဖော်ပြနေပါသည်-
<p class="centre">
<img src="images/beforeConversion.png" />
</p>
<br></br>
<br></br>

<p class="enTranslation">
First, we must select the Tools,Myanmar Converter on toolbar.
</p>
<p lang="my" class="myTranslation">
ပထမဆုံး​အနေဖြင့် ကျွန်တော်တို့ဟာ toolbar(ကိရိယာတန်ဆာပလာဘား) ပေါ်က Tools ဆိုတဲ့ ကိရိယာထဲက Myanmar Converter ဆိုတဲ့ အရာကိုရွေးရပါမည်။ 
</p>
<p class="centre">
<img src="images/state1.png" alt="Ubuntu Software Center/Myanmar"/>
</p>
<br></br>
<br></br>

<p class="enTranslation">
The Myanmar Converter Options box is appeared and we can choose match exactly or match as suffix for Hostname and match exactly or match as prefix for Partname.And we must check Enable conversion for Pattern check box and click the Add button.
</p>
<p lang="my" class="myTranslation">
မြန်မာစာဖောင့်ပြောင်းလဲရာ၌ ရွေးချယ်ပိုင်ခွင့်များ (Myanmar Converter Options) ဆိုတဲ့ boxတစ်ခု ပေါ်လာပါမည်၊ ပြီးနောက်ကျွန်တော်တို့ဟာ အဓိကဆာလ်ဗာအမည် (Hostname) အတွက် အားလုံးကိုတိတိကျကျတွဲပါ (match exactyl) သို့မဟုတ် ​ရှေ့မှစ၍အားလုံးကိုတွဲပါ (match as suffix) ကိုရွေးချယ်ရပြီး လမ်းကြောင်းခွဲအမည် (Partname) အတွက်လည်း အားလုံးကိုတိတိကျကျတွဲပါ (match exactyl) သို့မဟုတ် အနောက်မှစ၍အားလုံးကိုတွဲပါ (match as prefix) ကိုရွေးချယ်ရပါမည်။ ထို့နောက် ကျွန်တော်တို့ဟာ ပုံစံအလိုက်ပြောင်းလဲ​နိုင်သောစနစ် (Enable conversion for Pattern) ဆိုတဲ့ check boxလေးကို အမှန်ပေးပြီး Add ဆိုတဲ့ ခလုပ်ကိုနှိပ်လိုက်ရပါမည်။</p>
<p  class="centre">
<img src="images/state2.png" />
</p>
<br></br>
<br></br>

<p class="enTranslation">After above states we can click the Ok button.</p>
<p lang="my" class="myTranslation">အထက်ပါအချက်များပြည့်စုံပြီဆိုလျှင်တော့ OK ဆိုတဲ့ခလုပ်ကိုနှိပ်နိုင်ပါပြီ။</p> 
<p  class="centre">
<img src="images/state3.png" />
</p>
<br></br>
<br></br>

<p class="enTranslation">And reload the web page, the Myanmar text will display correctly.</p>
<p lang="my" class="myTranslation">ထိုနောက် web page ကို reload ပြန်လုပ်ခိုင်းပြီးလျှင်တော့ မြန်မာစာလုံးတွေဟာ တိကျမှန်ကန်စွာ ထွက်ပေါ်လာပါလိမ့်မည်။</p>
<p  class="centre">
<img src="images/afterConversion.png" />
</p>
<br></br>
<br></br>

<p class="enTranslation">
If you want to send Myanmar text to another person with Zawgyi or other fonts, select the textarea and right click on mouse and then choose Myanmar Unicode Converter, Send form as: ,Zawgyi-One or as you like.You can send from Unicode to other fonts who can not use Unicode by using this states.
</p>
<p lang="my" class="myTranslation">
သင်ဟာ မြန်မာစာလုံးများကို ဇော်ဂျီ သို့မဟုတ် အခြားဖောင့်များဖြင့် အခြားသူတစ်ဦးကို ပေးပို့ချင်ရင်တော့၊ ​ပေးပို့ချင်တဲ့ textarea ကိုရွေးလိုက်ပါ။ ထို့နောက် မောက်စ်ပေါ်မှာညာဘက်ကိုတချက်ကလစ်လိုက်ပါ၊ ပြီး​လျှင်တော့ မြန်မာယူနီကုတ်ပြောင်းလဲခြင်း (Myanmar Unicode Converter) ထဲက ဤပုံစံဖြင့်ပို့ပါ- (Send form as:) ကိုရွေးပါ၊ ထို့နောက်ဇော်ဂျီ သို့မဟုတ် မိမိပို့ချင်သောဖောင့်ကို ရွေးလိုက်ပါ။ ဤပုံစံကိုအသုံးပြုခြင်းဖြင့် သင်ဟာ ယူနီကုတ်အသုံးမပြုနိုင်သေးသော သူများကို ယူနီကုတ်မှတဆင့် အခြားဖောင့်များသို့ ပြောင်းလည်းဆက်သွယ်၍ ရနိုင်ပါသည်။
</p>
<p  class="centre">
<img src="images/gmail.png" />
</p>

</div>
</body>
</html>
