const compileUtil = {
  getValue(expr, vm) {
    // 获取vm的 data 中对应的属性值
    return expr.split('.').reduce((data, currentVal) => { 
      // console.log('currentVal', currentVal, data, data[currentVal]);
      return data[currentVal]
    }, vm.$data)
  },
  getContentVal(expr, vm) { 
    reeturn expr.replace(/\{\{(.+?)\}\}/g, (...args) => { 
      return this.getVal(args[1], vm);
    })
  },
  text(node, expr, vm) { // v-text expr: msg '学习mvvm使用原理'
    // const value = vm.$data[expr]
    let value;
    if (expr.indexOf('{{') !== -1) {
      value = expr.replace(/\{\{(.+?)\}\}/g, (...args) => {
        // console.log('args', args[1]); // person.name person.age person.fav msg
        new watcher(vm, args[1], newVal => { 
          this.updater.textUpdater(node, this.getContentVal(expr, vm));
        })
        return this.getValue(args[1], vm)
      })
    } else { 
      value = this.getValue(expr, vm)
    }
    this.updater.textUpdater(node, value) 
  },
  html(node, expr, vm) { // v-html
    const value = this.getValue(expr, vm);
    new watcher(vm, expr, newVal => { 
      this.updater.htmlUpdater(node, newVal);
    });
    this.updater.htmlUpdater(node, value);
  },
  model(node, expr, vm) { // v-model
    const value = this.getValue(expr, vm);
    new watcher(vm, expr, newVal => { 
      this.updater.modelUpdater(node, newVal);
    })
    this.updater.modelUpdater(node, value);
  },
  on(node, expr, vm, eventName) { // v-on
    // expr: btnclick | eventName: click
    let fn = vm.$options.methods && vm.$options.methods[expr];
    node.addEventListener(eventName, fn.bind(vm), false);
  },
  // 更新的函数
  updater: {
    modelUpdater(node, value) {
      node.value = value;
    },
    htmlUpdater(node, value) {
      node.innerHTML = value;
    },
    textUpdater(node, value) { 
      node.textContent = value;
    }
  }
}

class Compile { 
  constructor(el, vm) { 
    this.el = this.isElementNode(el) ? el : document.querySelector(el);
    // console.log('this.el', this.el);
    this.vm = vm
    // 1.获取文档碎片对象，放入内存中 会减少页面的回流和重绘
    const fragement = this.node2Fragement(this.el)
    // console.log(fragement);

    // 2.编译模板
    this.compile(fragement)

    // 3.追加子元素到根元素上(不添加这句，此时页面内容会为空 )
    this.el.appendChild(fragement)
  }
  compile(fragement) { 
    // 获取子节点
    const childNodes = fragement.childNodes;

    // 遍历子节点
    [...childNodes].forEach(child => { 
      // 所有子节点（文本节点 元素节点）
      // console.log('child111', child);

      if (this.isElementNode(child)) {
        // 是元素节点
        // console.log('元素节点', child);
        // 编译元素节点
        this.compileElement(child)
      } else { 
        // 是文本节点
        // console.log('文本节点', child);
        // 编译文本节点
        this.compileText(child)
      }
      
      // 递归遍历子节点的子节点  
      if (child.childNodes && child.childNodes.length) { 
        this.compile(child)
      }

    })
  }
  // 编译元素节点
  compileElement(node) { 
    // console.log('node', node);
    // 获取节点上的属性
    const attributes = node.attributes;
    // console.log('attributes', attributes);
    [...attributes].forEach(attr => {
      //  console.log('attr', attr);
      const { name, value } = attr;
      // console.log('name', name, value); 
      if (this.isDirective(name)) { // 是一个指令 v-text v-html v-model v-on：cliick
        const [, directive] = name.split('-'); // text html model on:click
        const [dirName, eventName] = directive.split(':'); // text html nodel on
        // console.log('compileUtilDir', node, value, this.vm)
        // 更新数据 数据驱动视图
        compileUtil[dirName](node, value, this.vm, eventName);

        // 删除标签上的有指令的属性 v-text="msg"
        node.removeAttribute('v-' + directive);

      } else if (this.isEventName(name)) { // @click="btnClick"
        let [, eventName] = name.split('@')
        compileUtil['on'](node, value, this.vm, eventName);
      }
    })
  }
  // 编译文本节点
  compileText(node) { 
    const content = node.textContent;
    // console.log('content', content);
    // 正则匹配 是{{}} 结构的数据
    if (/\{\{(.+?)\}\}/.test(content)) { 
      // console.log(content);
      compileUtil['text'](node, content, this.vm)
    }
  }
  isEventName(attrName) { 
    return attrName.startsWith('@')
  }
  // 是否是 v- 开头的属性
  isDirective(attrName) { 
    return attrName.startsWith('v-')
  }
  node2Fragement(el) { 
    // 创建文档碎片
    const f = document.createDocumentFragment()
    let firstChild;
    while (firstChild = el.firstChild) { 
      // 将所有自节点插入文档碎片
      f.appendChild(firstChild)
    }
    return f
  }
  // 判断是否是元素节点对象
  isElementNode(node) { 
    return node.nodeType === 1
  }
}

class mVue { 
  constructor(options) { 
    this.$el = options.el;
    this.$data = options.data
    this.$options = options
    if (this.$el) { 
      // 1. 实现一个数据观察者
      new Observer(this.$data)
      // 2. 实现一个指令解析器
      new Compile(this.$el, this)
    }
  }
}