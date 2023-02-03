using System;
using System.Collections.Generic;
using System.ComponentModel;
using System.Data;
using System.Drawing;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using System.Windows.Forms;
using OpenQA.Selenium;
using OpenQA.Selenium.Chrome;
using OpenQA.Selenium.Interactions;
using OpenQA.Selenium.Internal;
using OpenQA.Selenium.Support;
using Fleck;
using Newtonsoft.Json;
using System.Runtime.InteropServices;
using System.Diagnostics;

namespace EasySpider
{
    class PublicVariable
    {
        public static bool isInitialized = false;
        public static double ratio = 0.5; //上面流程图窗口所占的大小比率
        public static Start start = null;
        public static Flow fr = null;
        public static Process chrome = null;
        public static string frontEndAddress = "https://servicewrapper.systems";
        public static string backEndAddress = "https://servicewrapper.systems";
    }
}
