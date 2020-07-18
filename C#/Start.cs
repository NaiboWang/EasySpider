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
using System.Threading;

namespace ServiceWrapper
{
    public partial class Start : Form
    {
        public static IWebDriver browser;
        public static IWebSocketConnection socket_start; //输入网址页面的socket
        public static IWebSocketConnection socket_window; //正式使用的窗口的socket
        public static IWebSocketConnection socket_flowchart; //流程图的socket
        public static WebSocketServer server;
        public static IntPtr chromeId;
        public static string[] links;
        public Flow fr;
        public string serviceListUrl = "http://183.129.170.180:8041/frontEnd/serviceList.html";

        [System.Runtime.InteropServices.DllImportAttribute("user32.dll", EntryPoint = "MoveWindow")]
        public static extern bool MoveWindow(System.IntPtr hWnd, int X, int Y, int nWidth, int nHeight, bool bRepaint);

        [DllImport("user32.dll")]
        public static extern IntPtr GetForegroundWindow();
        [System.Runtime.InteropServices.DllImport("user32.dll")]
        public static extern int SetForegroundWindow(IntPtr hwnd);

        [DllImport("user32", EntryPoint = "GetWindowThreadProcessId")]
        private static extern int GetWindowThreadProcessId(IntPtr hwnd, out int pid);

        [DllImport("user32.dll", EntryPoint = "SendMessage", SetLastError = true, CharSet = CharSet.Auto)]
        private static extern int SendMessage(IntPtr hwnd, uint wMsg, int wParam, int lParam);
        [DllImport("user32.dll")]
        private extern static bool SwapMouseButton(bool fSwap);
        [DllImport("user32.dll", SetLastError = true)]
        static extern void SwitchToThisWindow(IntPtr hWnd, bool fAltTab);

        [DllImport("user32.dll", EntryPoint = "ShowWindow", CharSet = CharSet.Auto)]
        public static extern int ShowWindow(IntPtr hwnd, int nCmdShow);

        const int WM_SYSCOMMAND = 0x0112;
        const int SC_CLOSE = 0xF060;
        const int SC_MINIMIZE = 0xF020;
        const int SC_MAXIMIZE = 0xF030;
        const int SC_RESTORE = 0xF120;

        public Start()
        {
            InitializeComponent();
            PublicVariable.start = this;
        }

        private void Start_Load(object sender, EventArgs e)
        {
            //string title = (string)Scripts().ExecuteScript("return document.title");
            server = new WebSocketServer("ws://0.0.0.0:8084");
            server.Start(socke =>
            {
                socke.OnOpen = () =>
                {
                    BeginInvoke(new ConnectionChange(ModifyState), new object[] { "与浏览器连接已建立，请使用。" });
                };
                socke.OnClose = () =>
                {
                    //BeginInvoke(new ConnectionChange(ModifyState), new object[] { "与浏览器连接已断开。" });
                };
                socke.OnMessage = message =>
                {

                    Msg msg = JsonConvert.DeserializeObject<Msg>(message);//result为上面的Json数据
                                                                          //处理连接操作
                    if (msg.type == 0)//如果是第一次连接操作，设定socket
                    {
                        if (msg.message.id == 0)
                        {
                            socket_window = socke;
                            Console.WriteLine("Socket Window Connected.");
                        }
                        else if (msg.message.id == 1)
                        {
                            socket_start = socke;
                            Console.WriteLine("Socket Start Connected.");
                        }
                        else
                        {
                            socket_flowchart = socke;
                            Console.WriteLine("Socket Flowchart Connected.");
                            //发送打开网页指令
                            //FlowMessage fmsg = JsonConvert.DeserializeObject<FlowMessage>("{\"type\":0,\"data\":{\"option\":1,\"parameters\":{\"url\":\"https://www.baidu.com\"}}}");
                            //fmsg.data.parameters.url = links[0];
                            //string json = JsonConvert.SerializeObject(fmsg);
                            //socket_flowchart.Send(json);
                        }
                    }
                    else //其他情况放在进程外处理
                    {
                        try
                        {
                            BeginInvoke(new GetMessage(HandleEvent), new object[] { message });
                        }
                        catch (Exception)
                        {

                            throw;
                        }
                    }

                };
            });
            try
            {
                SendKeys.Send("+");
                SendKeys.Send("+"); //测试是否能正常使用输入模块
            }
            catch (Exception)
            {
                MessageBox.Show("输入模块初始化失败，请退出360之类的安全软件！");
                Application.Exit();
            }
        }

        delegate void ConnectionChange(object input);//委托
        delegate void GetMessage(object input);

        //正式处理程序入口
        public void HandleEvent(object input)
        {
            
            Msg msg = JsonConvert.DeserializeObject<Msg>(input.ToString());//result为上面的Json数据
            if (msg.type == 1) //开始的时候输入网址
            {
                chromeId = GetForegroundWindow(); //记录下所在浏览器的进程Id号
                Console.WriteLine(chromeId);
                Console.WriteLine();
                //links = msg.message.links.Split(new string[] { "\n" }, StringSplitOptions.None);
                //List<string> list = links.ToList();
                //int l = links.Length;
                //if (links[l - 1].Length == 0)//如果最后一行是空行则删掉
                //{
                //    list.RemoveAt(l - 1);
                //}
                //links = list.ToArray();
                //if (browser != null)
                //{
                //    browser.Navigate().GoToUrl(links[0]);
                //}
                int width = System.Windows.Forms.Screen.PrimaryScreen.WorkingArea.Size.Width;
                int height = System.Windows.Forms.Screen.PrimaryScreen.WorkingArea.Size.Height;
                SendMessage(chromeId, WM_SYSCOMMAND, SC_RESTORE, 0); // 最大化
                MoveWindow(chromeId, 0, Convert.ToInt32(height * PublicVariable.ratio) - 120, width, 120 + Convert.ToInt32(height * (1.0 - PublicVariable.ratio)), true);
                if(fr!=null)
                {
                    if (msg.message.id != -1) //读取服务流程，不是新增的时候
                    {
                        fr.chromeBrowser.Load(Flow.flowChartUrl + msg.message.id.ToString());
                    }
                    //SwapMouseButton(true);
                    fr.Show();
                }
                Hide();
                //SwitchToThisWindow(chromeId,true);
                //ShowWindow(System.UIntPtr(browser.CurrentWindowHandle),2);
                SetForegroundWindow(Start.chromeId); //打开流程图窗口后将chrome窗口显示到最前方
                SetForegroundWindow(Handle); //打开流程图窗口后将chrome窗口显示到最前方
                SetForegroundWindow(Start.chromeId); //打开流程图窗口后将chrome窗口显示到最前方
                //MouseHelper.SetCursorPos(400, Convert.ToInt32(height * PublicVariable.ratio) - 110);
                //MouseHelper.mouse_event(MouseHelper.MOUSEEVENTF_RIGHTDOWN, 0, 0, 0, 0);
                //Thread.Sleep(50);
                //MouseHelper.mouse_event(MouseHelper.MOUSEEVENTF_RIGHTUP, 0, 0, 0, 0);
            }
            else if (msg.type == 2)
            {
                try
                {
                    SendKeys.Send(msg.message.keyboardStr);
                    SendKeys.Send("+");
                    SendKeys.Send("+"); //两个shift是为了防止有人按用中文输入法输入了英文按了回车，这样切换两次输入法就可以达到效果
                }
                catch (Exception)
                {
                    MessageBox.Show("输入失败，请退出360之类的安全软件！");
                }
               
            }
            else if (msg.type == 3)
            {
                if (msg.from == 0)
                {
                    socket_flowchart.Send(msg.message.pipe); //直接把消息转接
                }
                else
                {
                    socket_window.Send(msg.message.pipe);
                }
            }
            else if (msg.type == 5)
            {
                string FileName = Application.StartupPath + @"/Chrome/ServiceWrapper_ExcuteStage.exe"; //启动的应用程序名称
                Process.Start(FileName, msg.message.id.ToString()); //启动执行程序
            }
        }

        public void ModifyState(object input)
        {
            State.Text = (string)input;
        }


        public static IJavaScriptExecutor Scripts()
        {
            return (IJavaScriptExecutor)browser;
        }

        private void button1_Click(object sender, EventArgs e)
        {
            fr = new Flow(); //先创造流程图界面，暂时隐藏不显示
            fr.Show();
            fr.Hide();
            State.Text = "加载中……";
            ChromeOptions options = new ChromeOptions();
            options.AddExtension(Application.StartupPath + @"/ServiceWrapper.crx");
            browser = new ChromeDriver(Application.StartupPath +@"/Chrome", options);
            browser.Navigate().GoToUrl(serviceListUrl); //默认可以修改服务
            //ProcessStartInfo startInfo = new ProcessStartInfo();
            //startInfo.FileName = Application.StartupPath + @"/Chrome/chrome.exe"; //启动的应用程序名称
            //SwapMouseButton(false);//此时此刻的鼠标应该是默认状态
            //PublicVariable.chrome =  Process.Start(startInfo);
            //browser.Navigate().GoToUrl("file:///Start.html");
        }

        private void button2_Click(object sender, EventArgs e)
        {
            Flow fr2 = new Flow(serviceListUrl+"?type=1"); //加载的页面不可增加和修改服务
            fr2.closedriver = false;
            fr2.WindowState = FormWindowState.Maximized; //最大化窗口
            fr2.Show();
            Hide();
        }
    }
}
