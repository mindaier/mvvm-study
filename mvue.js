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
        // 编译元素节点
        console.log('元素节点', child);
      } else { 
        // 是文本节点
        // 编译文本节点
        console.log('文本节点', child);
      }
      
      // 递归遍历子节点的子节点  
      if (child.childNodes && child.childNodes.length) { 
        this.compile(child)
      }

    })
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
      // 2. 实现一个指令解析器
      new Compile(this.$el, this)
    }
  }
}