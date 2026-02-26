// Licensed to the Software Freedom Conservancy (SFC) under one
// or more contributor license agreements.  See the NOTICE file
// distributed with this work for additional information
// regarding copyright ownership.  The SFC licenses this file
// to you under the Apache License, Version 2.0 (the
// "License"); you may not use this file except in compliance
// with the License.  You may obtain a copy of the License at
//
//   http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing,
// software distributed under the License is distributed on an
// "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
// KIND, either express or implied.  See the License for the
// specific language governing permissions and limitations
// under the License.

const ExtensionData = require('./extensionData')

/**
 * Represents the commands and events under Extension Module.
 * Described in https://w3c.github.io/webdriver-bidi/#module-webExtension
 */
class WebExtension {
  constructor(driver) {
    this._driver = driver
  }

  async init() {
    if (!(await this._driver.getCapabilities()).get('webSocketUrl')) {
      throw Error('WebDriver instance must support BiDi protocol')
    }

    this.bidi = await this._driver.getBidi()
  }

  /**
   * Install a browser webExtension.
   *
   * @param {ExtensionData} extensionData
   *   An instance of ExtensionData containing the webExtension’s path, archive path or base64 encoded path.
   * @returns {Promise<string>}
   *   The installed webExtension’s ID.
   * @throws {Error} If extensionData is not an ExtensionData instance.
   */
  async install(extensionData) {
    if (!(extensionData instanceof ExtensionData)) {
      throw new Error('install() requires an ExtensionData instance')
    }

    const command = {
      method: 'webExtension.install',
      params: {
        extensionData: extensionData.asMap(),
      },
    }

    // 在 webExtension.js:58 行后添加
    let response = await this.bidi.send(command)
    console.log('=== BiDi Response ===')
    console.log('Type:', response.type)
    console.log('Result:', response.result)
    console.log('Full:', JSON.stringify(response, null, 2))
    
    return response.result.extension
  }

  /**
   * Uninstall a browser webExtension by ID.
   *
   * @param {string} id
   *   The webExtension ID.
   * @returns {Promise<void>}
   * @throws {Error} If the uninstall command returns an error from the browser.
   */
  async uninstall(id) {
    const command = {
      method: 'webExtension.uninstall',
      params: {
        extension: id,
      },
    }

    const response = await this.bidi.send(command)

    if (response.type === 'error') {
      throw new Error(`${response.error}: ${response.message}`)
    }
  }
}

/**
 * Helper to create and initialize an Extension instance.
 *
 * @param {import('selenium-webdriver').WebDriver} driver
 *   A Selenium WebDriver instance.
 * @returns {Promise<WebExtension>}
 *   An Extension instance.
 */
async function getWebExtensionInstance(driver) {
  let instance = new WebExtension(driver)
  await instance.init()
  return instance
}

module.exports = getWebExtensionInstance
