using System;
using System.Collections.Generic;
using System.ComponentModel;
using System.Data;
using System.Drawing;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using System.Windows.Forms;
using CefSharp;
using CefSharp.WinForms;
using System.Runtime.InteropServices; //引用此名称空间，简化后面的代码
using System.Net;
using System.Diagnostics;

namespace EasySpider
{

    public partial class Flow : Form, IMessageFilter
    {
        public ChromiumWebBrowser chromeBrowser;
        public bool ChromeNow = false; //标记现在所在窗口是否为chrome
        public static string flowChartUrl = PublicVariable.frontEndAddress + "/FlowChart.html?id="; //流程图所在的位置
        public string url = flowChartUrl + "-1&backEndAddressServiceWrapper=" + PublicVariable.backEndAddress;
        public Flow()
        {
            InitializeComponent();
        }
        public Flow(string link)
        {
            InitializeComponent();
            url = link;
            button1.Show();
        }
        // P/Invoke declarations
        [DllImport("user32.dll")]
        public static extern IntPtr GetForegroundWindow();
        [DllImport("user32.dll")]
        private extern static bool SwapMouseButton(bool fSwap);
        [System.Runtime.InteropServices.DllImport("user32.dll")]
        public static extern int SetForegroundWindow(IntPtr hwnd);
        public const int WM_CLOSE = 0x10;
        public bool closedriver = true;
        [DllImport("user32.dll", EntryPoint = "SendMessage")]
        private static extern int SendMessage(IntPtr hwnd, int wMsg, int wParam, int lParam);

        public bool PreFilterMessage(ref System.Windows.Forms.Message SystemMessage)
        {
            if (SystemMessage.Msg >= 513 && SystemMessage.Msg <= 515)
            {//不响应鼠标左键消息                
                return true;
            }
            return false;
        }
        private void Flow_Load(object sender, EventArgs e)
        {
            InitializeChromium();
            PublicVariable.isInitialized = true;
            //保证并排平铺
            int width = System.Windows.Forms.Screen.PrimaryScreen.WorkingArea.Size.Width;
            int height = System.Windows.Forms.Screen.PrimaryScreen.WorkingArea.Size.Height;
            StartPosition = FormStartPosition.Manual; //窗体的位置由Location属性决定
            Location = (Point)new Size(0, 0);         //窗体的起始位置为(x,y)
            Width = width;
            Height = Convert.ToInt32(height * 0.8);
            FormClosing += Flow_FormClosing;
        }

        //初始化浏览器并启动
        public void InitializeChromium()
        {
            if (!PublicVariable.isInitialized)//只初始化一次
            {
                CefSettings settings = new CefSettings();
                Cef.Initialize(settings);
            }
            // Create a browser component
            chromeBrowser = new ChromiumWebBrowser(url);
            //跨域访问允许
            chromeBrowser.BrowserSettings.FileAccessFromFileUrls = CefState.Enabled;
            chromeBrowser.BrowserSettings.UniversalAccessFromFileUrls = CefState.Enabled;
            //textBox1.Text = url;
            // Add it to the form and fill it to the form window.
            panel1.Controls.Add(chromeBrowser);
            chromeBrowser.Dock = DockStyle.Fill;
            chromeBrowser.RenderProcessMessageHandler = new RenderProcessMessageHandler();
        }

        //窗体关闭时，记得停止浏览器
        private void Flow_FormClosing(object sender, FormClosingEventArgs e)
        {
            if(closedriver)
            {
                //Cef.Shutdown();//关掉内嵌控件
                try
                {
                    //PublicVariable.chrome.Kill();//关掉chrome
                    //SendMessage(Start.chromeId, WM_CLOSE, 0, 0);//关掉chrome
                    Start.browser.Quit();//关掉chromedriver
                }
                catch (Exception)
                {
                }
            }
            PublicVariable.start.Show(); //重新显示初始框
        }

        private void panel1_Paint(object sender, PaintEventArgs e)
        {
            SetForegroundWindow(Start.chromeId); //打开流程图窗口后将chrome窗口显示到最前方
        }

        private void button1_Click(object sender, EventArgs e)
        {
            chromeBrowser.Back();
        }

        private void panel1_Paint_1(object sender, PaintEventArgs e)
        {

        }
    }
}
