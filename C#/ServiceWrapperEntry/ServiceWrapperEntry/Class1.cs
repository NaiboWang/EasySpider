using CefSharp;
using CefSharp.Internals;
using CefSharp.Web;
using CefSharp.WinForms;
using System;
using System.ComponentModel;
using System.Drawing;
using System.Windows.Forms;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using System.Runtime.InteropServices;

namespace EasySpider
{
    public class MouseHelper
    {
        [System.Runtime.InteropServices.DllImport("user32")]
        public static extern int mouse_event(int dwFlags, int dx, int dy, int cButtons, int dwExtraInfo);
        //移动鼠标 
        public const int MOUSEEVENTF_MOVE = 0x0001;
        //模拟鼠标左键按下 
        public const int MOUSEEVENTF_LEFTDOWN = 0x0002;
        //模拟鼠标左键抬起 
        public const int MOUSEEVENTF_LEFTUP = 0x0004;
        //模拟鼠标右键按下 
        public const int MOUSEEVENTF_RIGHTDOWN = 0x0008;
        //模拟鼠标右键抬起 
        public const int MOUSEEVENTF_RIGHTUP = 0x0010;
        //模拟鼠标中键按下 
        public const int MOUSEEVENTF_MIDDLEDOWN = 0x0020;
        //模拟鼠标中键抬起 
        public const int MOUSEEVENTF_MIDDLEUP = 0x0040;
        //标示是否采用绝对坐标 
        public const int MOUSEEVENTF_ABSOLUTE = 0x8000;
        [DllImport("user32.dll")]
        public static extern bool SetCursorPos(int X, int Y);
    }
    public class Parameters
    {
        /// <summary>
        /// 
        /// </summary>
        public string url { get; set; }
    }

    public class Data
    {
        /// <summary>
        /// 
        /// </summary>
        public int option { get; set; }
        /// <summary>
        /// 
        /// </summary>
        public Parameters parameters { get; set; }
    }

    public class FlowMessage
    {
        /// <summary>
        /// 
        /// </summary>
        public int type { get; set; }
        /// <summary>
        /// 
        /// </summary>
        public Data data { get; set; }
    }

    public class Message
    {
        /// <summary>
        /// 
        /// </summary>
        public int id { get; set; }
        public string links { get; set; }
        public string link { get; set; }
        //键盘输入的值
        public string keyboardStr { get; set; }
        //直接转接流程图的消息
        public string pipe { get; set; }
    }


    public class Msg
    {
        /// <summary>
        /// 
        /// </summary>
        public int type { get; set; }
        /// <summary>
        /// 从哪里来
        /// </summary>
        public int from { get; set; }
        public Message message { get; set; }
    }

    public class RequestContextHandler : IRequestContextHandler
    {
        public IResourceRequestHandler GetResourceRequestHandler(IBrowser browser, IFrame frame, IRequest request, bool isNavigation, bool isDownload, string requestInitiator, ref bool disableDefaultHandling)
        {
            return null;
        }

        public bool OnBeforePluginLoad(string mimeType, string url, bool isMainFrame, string topOriginUrl, WebPluginInfo pluginInfo, ref PluginPolicy pluginPolicy)
        {
            return true;
        }

        public void OnRequestContextInitialized(IRequestContext requestContext)
        {
           
        }
    }
    //加载窗口时的事件设置
    public class RenderProcessMessageHandler : IRenderProcessMessageHandler
    {
        public void OnContextReleased(IWebBrowser chromiumWebBrowser, IBrowser browser, IFrame frame)
        {
            //throw new NotImplementedException();
        }

        public void OnFocusedNodeChanged(IWebBrowser chromiumWebBrowser, IBrowser browser, IFrame frame, IDomNode node)
        {
            //throw new NotImplementedException();
        }

        public void OnUncaughtException(IWebBrowser chromiumWebBrowser, IBrowser browser, IFrame frame, JavascriptException exception)
        {
            //throw new NotImplementedException();
        }

        // Wait for the underlying JavaScript Context to be created. This is only called for the main frame.
        // If the page has no JavaScript, no context will be created.
        void IRenderProcessMessageHandler.OnContextCreated(IWebBrowser browserControl, IBrowser browser, IFrame frame)
        {
            //MessageBox.Show("zhixing");
            
        }
    }

    /// <summary>
    /// 在自己窗口打开链接
    /// </summary>
    internal class OpenPageSelf : ILifeSpanHandler
    {
        public bool DoClose(IWebBrowser browserControl, IBrowser browser)
        {
            return false;
        }

        public void OnAfterCreated(IWebBrowser browserControl, IBrowser browser)
        {
           
        }

        public void OnBeforeClose(IWebBrowser browserControl, IBrowser browser)
        {

        }

        public bool OnBeforePopup(IWebBrowser browserControl, IBrowser browser, IFrame frame, string targetUrl,
string targetFrameName, WindowOpenDisposition targetDisposition, bool userGesture, IPopupFeatures popupFeatures,
IWindowInfo windowInfo, IBrowserSettings browserSettings, ref bool noJavascriptAccess, out IWebBrowser newBrowser)
        {
            newBrowser = null;
            var chromiumWebBrowser = (ChromiumWebBrowser)browserControl;
            chromiumWebBrowser.Load(targetUrl);
            return true; //Return true to cancel the popup creation copyright by codebye.com.
        }
    }
}
