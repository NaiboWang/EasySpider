using System.Diagnostics;
using System.IO;

using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using System.Windows.Forms;

namespace shortcut
{
    internal static class Program
    {
        /// <summary>
        /// The main entry point for the application.
        /// </summary>
        [STAThread]
        static void Main()
        {
            Application.EnableVisualStyles();
            Application.SetCompatibleTextRenderingDefault(false);
            if (new DirectoryInfo(Application.StartupPath + "\\EasySpider\\").Exists)
                Process.Start(Application.StartupPath + "\\EasySpider\\EasySpider.exe");
            else
                Process.Start(Application.StartupPath + "\\Debug\\EasySpider.exe");
        }
    }
}
