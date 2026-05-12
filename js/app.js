// 主应用类
class ResumeApp {
  constructor() {
    this.data = this.loadData() || this.getDefaultData();
    this.versions = this.loadVersions() || [];
    this.currentSection = 'basic';
    this.currentProjectId = null;
    this.init();
  }

  getDefaultData() {
    return {
      basic: {
        name: '',
        gender: '',
        political: '',
        hometown: '',
        jobTarget: '',
        birthDate: '',
        email: '',
        phone: '',
        avatar: ''
      },
      education: [],
      projects: [],
      campus: [],
      skills: []
    };
  }

  init() {
    this.bindEvents();
    this.renderAll();
    this.startAutoSave();
    this.updateNavInfo();
    this.saveVersion(); // 保存初始版本
  }

  // ========== 版本历史功能 ==========
  loadVersions() {
    try {
      const data = localStorage.getItem('resumeVersions');
      return data ? JSON.parse(data) : [];
    } catch (e) {
      return [];
    }
  }

  saveVersions() {
    localStorage.setItem('resumeVersions', JSON.stringify(this.versions));
  }

  saveVersion() {
    const version = {
      id: Date.now(),
      data: JSON.parse(JSON.stringify(this.data)),
      timestamp: new Date().toISOString(),
      number: this.versions.length + 1
    };
    
    this.versions.push(version);
    
    // 只保留最近10个版本
    if (this.versions.length > 10) {
      this.versions.shift();
    }
    
    this.saveVersions();
  }

  restoreVersion(versionId) {
    const version = this.versions.find(v => v.id === versionId);
    if (!version) return;
    
    // 先保存当前状态为新版本，以便可以回退回来
    this.saveVersion();
    
    // 恢复版本
    this.data = JSON.parse(JSON.stringify(version.data));
    this.renderAll();
    this.saveData();
    this.toggleVersionHistory();
    this.showToast(`已恢复到版本 ${version.number}`);
  }

  renderVersionHistory() {
    const container = document.getElementById('versionList');
    if (!container) return;
    
    container.innerHTML = this.versions.slice().reverse().map(version => `
      <div class="version-item" onclick="app.restoreVersion(${version.id})">
        <div class="version-number">版本 ${version.number}</div>
        <div class="version-time">${new Date(version.timestamp).toLocaleString('zh-CN')}</div>
      </div>
    `).join('');
  }

  toggleVersionHistory() {
    const modal = document.getElementById('versionModal');
    modal.classList.toggle('active');
    if (modal.classList.contains('active')) {
      this.renderVersionHistory();
    }
  }

  // ========== 事件绑定 ==========
  bindEvents() {
    // 导航切换
    document.querySelectorAll('.nav-item').forEach(item => {
      item.addEventListener('click', (e) => {
        e.preventDefault();
        const section = item.dataset.section;
        this.switchSection(section);
      });
    });

    // 侧边栏折叠
    document.getElementById('toggleSidebar').addEventListener('click', () => {
      document.getElementById('sidebar').classList.toggle('collapsed');
      document.getElementById('mainContent').classList.toggle('expanded');
    });

    // 基本信息输入监听
    document.querySelectorAll('#basic input, #basic select').forEach(input => {
      input.addEventListener('input', (e) => {
        const field = e.target.dataset.field;
        if (field) {
          this.data.basic[field] = e.target.value;
          if (field === 'name' || field === 'jobTarget') {
            this.updateNavInfo();
          }
          this.markUnsaved();
        }
      });
    });

    // 拖拽排序
    this.initSortable();
  }

  initSortable() {
    const eduList = document.getElementById('educationList');
    if (eduList) {
      new Sortable(eduList, {
        animation: 150,
        handle: '.drag-handle',
        ghostClass: 'sortable-ghost',
        onEnd: () => {
          this.reorderEducation();
        }
      });
    }
  }

  switchSection(section) {
    this.currentSection = section;
    
    // 更新导航状态
    document.querySelectorAll('.nav-item').forEach(item => {
      item.classList.toggle('active', item.dataset.section === section);
    });

    // 显示对应内容
    document.querySelectorAll('main > div > section').forEach(sec => {
      sec.classList.toggle('hidden', sec.id !== section);
    });

    // 移动端关闭侧边栏
    if (window.innerWidth < 1024) {
      document.getElementById('sidebar').classList.add('collapsed');
      document.getElementById('mainContent').classList.add('expanded');
    }
  }

  // ========== 基本信息 ==========
  handleAvatarUpload(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      this.data.basic.avatar = e.target.result;
      this.renderAvatar();
      this.markUnsaved();
    };
    reader.readAsDataURL(file);
  }

  renderAvatar() {
    const preview = document.getElementById('avatarPreview');
    if (this.data.basic.avatar) {
      preview.innerHTML = `<img src="${this.data.basic.avatar}" class="w-full h-full object-cover" alt="头像">`;
      preview.classList.remove('border-dashed');
    } else {
      preview.innerHTML = '<i class="fas fa-camera text-ink-400 text-2xl"></i>';
      preview.classList.add('border-dashed');
    }
  }

  updateNavInfo() {
    document.getElementById('navUserName').textContent = this.data.basic.name || '未填写姓名';
    document.getElementById('navUserTitle').textContent = this.data.basic.jobTarget || '未填写求职意向';
  }

  // ========== 教育经历 ==========
  addEducation() {
    this.data.education.unshift({
      id: Date.now(),
      startDate: '',
      endDate: '',
      school: '',
      major: '',
      degree: '',
      gpa: '',
      ranking: '',
      courses: '',
      honors: ''
    });
    this.renderEducation();
    this.markUnsaved();
    this.saveVersion();
  }

  removeEducation(id) {
    this.data.education = this.data.education.filter(e => e.id !== id);
    this.renderEducation();
    this.markUnsaved();
    this.saveVersion();
  }

  reorderEducation() {
    const items = document.querySelectorAll('#educationList > div');
    const newOrder = [];
    items.forEach(item => {
      const id = parseInt(item.dataset.id);
      const edu = this.data.education.find(e => e.id === id);
      if (edu) newOrder.push(edu);
    });
    this.data.education = newOrder;
    this.markUnsaved();
  }

  renderEducation() {
    const container = document.getElementById('educationList');
    if (!container) return;

    container.innerHTML = this.data.education.map(edu => `
      <div class="card p-5 timeline-item" data-id="${edu.id}">
        <div class="flex items-start justify-between mb-4">
          <div class="flex items-center gap-3">
            <i class="fas fa-grip-vertical drag-handle text-ink-300 cursor-grab"></i>
            <h3 class="font-semibold text-ink-800">教育经历</h3>
          </div>
          <button onclick="app.removeEducation(${edu.id})" class="btn-danger">
            <i class="fas fa-trash-alt"></i> 删除
          </button>
        </div>
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-sm text-ink-500 mb-1">开始时间</label>
            <input type="month" class="input-field" value="${edu.startDate}" onchange="app.updateEducation(${edu.id}, 'startDate', this.value)">
          </div>
          <div>
            <label class="block text-sm text-ink-500 mb-1">结束时间</label>
            <input type="month" class="input-field" value="${edu.endDate}" onchange="app.updateEducation(${edu.id}, 'endDate', this.value)">
          </div>
          <div>
            <label class="block text-sm text-ink-500 mb-1">学校名称</label>
            <input type="text" class="input-field" placeholder="学校名称" value="${edu.school}" onchange="app.updateEducation(${edu.id}, 'school', this.value)">
          </div>
          <div>
            <label class="block text-sm text-ink-500 mb-1">专业</label>
            <input type="text" class="input-field" placeholder="专业" value="${edu.major}" onchange="app.updateEducation(${edu.id}, 'major', this.value)">
          </div>
          <div>
            <label class="block text-sm text-ink-500 mb-1">学历</label>
            <select class="input-field" onchange="app.updateEducation(${edu.id}, 'degree', this.value)">
              <option value="">请选择</option>
              <option value="本科" ${edu.degree === '本科' ? 'selected' : ''}>本科</option>
              <option value="硕士" ${edu.degree === '硕士' ? 'selected' : ''}>硕士</option>
              <option value="博士" ${edu.degree === '博士' ? 'selected' : ''}>博士</option>
              <option value="大专" ${edu.degree === '大专' ? 'selected' : ''}>大专</option>
            </select>
          </div>
          <div>
            <label class="block text-sm text-ink-500 mb-1">GPA</label>
            <input type="text" class="input-field" placeholder="如：3.8/4.0" value="${edu.gpa}" onchange="app.updateEducation(${edu.id}, 'gpa', this.value)">
          </div>
          <div class="col-span-2">
            <label class="block text-sm text-ink-500 mb-1">主修课程</label>
            <input type="text" class="input-field" placeholder="填写主修课程，用逗号分隔" value="${edu.courses}" onchange="app.updateEducation(${edu.id}, 'courses', this.value)">
          </div>
          <div class="col-span-2">
            <label class="block text-sm text-ink-500 mb-1">荣誉奖项</label>
            <div class="editor-toolbar">
              <button onclick="app.formatText('edu-honors-${edu.id}', 'bold')"><i class="fas fa-bold"></i></button>
              <button onclick="app.formatText('edu-honors-${edu.id}', 'italic')"><i class="fas fa-italic"></i></button>
              <button onclick="app.formatText('edu-honors-${edu.id}', 'insertUnorderedList')"><i class="fas fa-list-ul"></i></button>
            </div>
            <div id="edu-honors-${edu.id}" class="rich-editor" contenteditable="true" onblur="app.updateEducation(${edu.id}, 'honors', this.innerHTML)">${edu.honors}</div>
          </div>
        </div>
      </div>
    `).join('');
  }

  updateEducation(id, field, value) {
    const edu = this.data.education.find(e => e.id === id);
    if (edu) {
      edu[field] = value;
      this.markUnsaved();
    }
  }

  // ========== 项目经历 ==========
  addProject() {
    const project = {
      id: Date.now(),
      name: '新项目',
      role: '',
      startDate: '',
      endDate: '',
      techStack: '',
      description: '',
      achievements: '',
      tags: [],
      files: []
    };
    this.data.projects.push(project);
    this.renderProjects();
    this.selectProject(project.id);
    this.markUnsaved();
    this.saveVersion();
  }

  removeProject(id) {
    this.data.projects = this.data.projects.filter(p => p.id !== id);
    if (this.currentProjectId === id) {
      this.currentProjectId = null;
    }
    this.renderProjects();
    this.renderProjectDetail();
    this.markUnsaved();
    this.saveVersion();
  }

  selectProject(id) {
    this.currentProjectId = id;
    this.renderProjects();
    this.renderProjectDetail();
  }

  filterProjects(keyword) {
    this.renderProjects(keyword);
  }

  renderProjects(keyword = '') {
    const container = document.getElementById('projectList');
    const countEl = document.getElementById('projectCount');
    if (!container) return;

    countEl.textContent = this.data.projects.length;

    let projects = this.data.projects;
    if (keyword) {
      projects = projects.filter(p => 
        p.name.toLowerCase().includes(keyword.toLowerCase()) ||
        p.techStack.toLowerCase().includes(keyword.toLowerCase())
      );
    }

    container.innerHTML = projects.map(p => `
      <div class="project-list-item flex items-center justify-between p-3 rounded-lg ${p.id === this.currentProjectId ? 'active' : ''}" onclick="app.selectProject(${p.id})">
        <div class="min-w-0">
          <div class="font-medium text-sm text-ink-700 truncate">${p.name}</div>
          <div class="text-xs text-ink-400 mt-0.5">${p.startDate || '未设置'} ~ ${p.endDate || '至今'}</div>
        </div>
        <button onclick="event.stopPropagation(); app.removeProject(${p.id})" class="p-1.5 rounded-lg hover:bg-red-50 text-ink-400 hover:text-red-500 transition-colors ml-2">
          <i class="fas fa-trash-alt text-xs"></i>
        </button>
      </div>
    `).join('');

    if (projects.length === 0) {
      container.innerHTML = '<div class="text-center py-8 text-ink-400 text-sm">暂无项目</div>';
    }
  }

  renderProjectDetail() {
    const container = document.getElementById('projectDetail');
    if (!container) return;

    if (!this.currentProjectId) {
      container.innerHTML = `
        <div class="text-center py-12 text-ink-400">
          <i class="fas fa-folder-open text-4xl mb-3"></i>
          <p>选择一个项目进行编辑，或创建新项目</p>
        </div>
      `;
      return;
    }

    const project = this.data.projects.find(p => p.id === this.currentProjectId);
    if (!project) return;

    const tagsHtml = ['电商', '数据分析', '竞赛', 'Web开发', '移动应用', 'AI/ML'].map(tag => `
      <label class="tag ${project.tags.includes(tag) ? 'tag-blue' : 'bg-ink-100 text-ink-500'} cursor-pointer select-none">
        <input type="checkbox" class="hidden" ${project.tags.includes(tag) ? 'checked' : ''} onchange="app.toggleProjectTag(${project.id}, '${tag}')">
        ${tag}
      </label>
    `).join('');

    const filesHtml = project.files.map((file, idx) => `
      <div class="flex items-center justify-between p-3 bg-ink-50 rounded-lg">
        <div class="flex items-center gap-3 min-w-0">
          <i class="fas ${file.name.endsWith('.pdf') ? 'fa-file-pdf text-red-500' : 'fa-file-word text-blue-500'}"></i>
          <span class="text-sm text-ink-700 truncate">${file.name}</span>
        </div>
        <div class="flex items-center gap-2 ml-2">
          <button onclick="app.previewFile(${project.id}, ${idx})" class="p-1.5 rounded-lg hover:bg-white text-ink-400 hover:text-primary-500 transition-colors">
            <i class="fas fa-eye text-xs"></i>
          </button>
          <button onclick="app.removeFile(${project.id}, ${idx})" class="p-1.5 rounded-lg hover:bg-white text-ink-400 hover:text-red-500 transition-colors">
            <i class="fas fa-trash-alt text-xs"></i>
          </button>
        </div>
      </div>
    `).join('');

    container.innerHTML = `
      <div class="space-y-5">
        <div class="flex items-center justify-between">
          <h3 class="font-semibold text-lg text-ink-800">${project.name}</h3>
          <div class="flex items-center gap-2">
            <button onclick="app.copyProjectDesc(${project.id})" class="btn-secondary text-xs">
              <i class="fas fa-copy"></i> 复制描述
            </button>
            <button onclick="app.exportSingleProject(${project.id})" class="btn-secondary text-xs">
              <i class="fas fa-file-export"></i> 导出
            </button>
          </div>
        </div>
        <div class="grid grid-cols-2 gap-4">
          <div class="col-span-2">
            <label class="block text-sm text-ink-500 mb-1">项目名称</label>
            <input type="text" class="input-field" value="${project.name}" onchange="app.updateProject(${project.id}, 'name', this.value)">
          </div>
          <div>
            <label class="block text-sm text-ink-500 mb-1">项目角色</label>
            <input type="text" class="input-field" placeholder="如：前端负责人" value="${project.role}" onchange="app.updateProject(${project.id}, 'role', this.value)">
          </div>
          <div>
            <label class="block text-sm text-ink-500 mb-1">技术栈</label>
            <input type="text" class="input-field" placeholder="如：Vue, Node.js, MySQL" value="${project.techStack}" onchange="app.updateProject(${project.id}, 'techStack', this.value)">
          </div>
          <div>
            <label class="block text-sm text-ink-500 mb-1">开始时间</label>
            <input type="month" class="input-field" value="${project.startDate}" onchange="app.updateProject(${project.id}, 'startDate', this.value)">
          </div>
          <div>
            <label class="block text-sm text-ink-500 mb-1">结束时间</label>
            <input type="month" class="input-field" value="${project.endDate}" onchange="app.updateProject(${project.id}, 'endDate', this.value)">
          </div>
          <div class="col-span-2">
            <label class="block text-sm text-ink-500 mb-1">项目标签</label>
            <div class="flex flex-wrap gap-2">${tagsHtml}</div>
          </div>
          <div class="col-span-2">
            <label class="block text-sm text-ink-500 mb-1">项目描述</label>
            <div class="editor-toolbar">
              <button onclick="app.formatText('proj-desc-${project.id}', 'bold')"><i class="fas fa-bold"></i></button>
              <button onclick="app.formatText('proj-desc-${project.id}', 'italic')"><i class="fas fa-italic"></i></button>
              <button onclick="app.formatText('proj-desc-${project.id}', 'insertUnorderedList')"><i class="fas fa-list-ul"></i></button>
              <button onclick="app.formatText('proj-desc-${project.id}', 'insertOrderedList')"><i class="fas fa-list-ol"></i></button>
            </div>
            <div id="proj-desc-${project.id}" class="rich-editor" contenteditable="true" onblur="app.updateProject(${project.id}, 'description', this.innerHTML)">${project.description}</div>
          </div>
          <div class="col-span-2">
            <label class="block text-sm text-ink-500 mb-1">项目成果</label>
            <div class="editor-toolbar">
              <button onclick="app.formatText('proj-achieve-${project.id}', 'bold')"><i class="fas fa-bold"></i></button>
              <button onclick="app.formatText('proj-achieve-${project.id}', 'italic')"><i class="fas fa-italic"></i></button>
              <button onclick="app.formatText('proj-achieve-${project.id}', 'insertUnorderedList')"><i class="fas fa-list-ul"></i></button>
            </div>
            <div id="proj-achieve-${project.id}" class="rich-editor" contenteditable="true" onblur="app.updateProject(${project.id}, 'achievements', this.innerHTML)">${project.achievements}</div>
          </div>
          <div class="col-span-2">
            <label class="block text-sm text-ink-500 mb-2">相关文件</label>
            <div class="file-drop-zone p-6 text-center cursor-pointer" onclick="document.getElementById('projectFileInput').click()"
              ondragover="this.classList.add('dragover')" ondragleave="this.classList.remove('dragover')"
              ondrop="app.handleProjectFileDrop(event, ${project.id})">
              <i class="fas fa-cloud-upload-alt text-2xl text-ink-400 mb-2"></i>
              <p class="text-sm text-ink-500">点击或拖拽文件到此处上传</p>
              <p class="text-xs text-ink-400 mt-1">支持 .docx, .pdf 格式，最大10MB</p>
            </div>
            <input type="file" id="projectFileInput" class="hidden" accept=".docx,.pdf" onchange="app.handleProjectFileUpload(event, ${project.id})">
            <div class="mt-3 space-y-2">${filesHtml}</div>
          </div>
        </div>
      </div>
    `;
  }

  updateProject(id, field, value) {
    const project = this.data.projects.find(p => p.id === id);
    if (project) {
      project[field] = value;
      if (field === 'name') {
        this.renderProjects();
      }
      this.markUnsaved();
    }
  }

  toggleProjectTag(id, tag) {
    const project = this.data.projects.find(p => p.id === id);
    if (project) {
      const idx = project.tags.indexOf(tag);
      if (idx > -1) {
        project.tags.splice(idx, 1);
      } else {
        project.tags.push(tag);
      }
      this.renderProjectDetail();
      this.markUnsaved();
    }
  }

  handleProjectFileUpload(event, projectId) {
    const file = event.target.files[0];
    if (file) this.addProjectFile(projectId, file);
  }

  handleProjectFileDrop(event, projectId) {
    event.preventDefault();
    event.currentTarget.classList.remove('dragover');
    const file = event.dataTransfer.files[0];
    if (file) this.addProjectFile(projectId, file);
  }

  addProjectFile(projectId, file) {
    if (file.size > 10 * 1024 * 1024) {
      this.showToast('文件大小不能超过10MB', 'error');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const project = this.data.projects.find(p => p.id === projectId);
      if (project) {
        project.files.push({
          name: file.name,
          type: file.type,
          data: e.target.result
        });
        this.renderProjectDetail();
        this.markUnsaved();
        this.showToast('文件上传成功');
      }
    };
    reader.readAsDataURL(file);
  }

  removeFile(projectId, fileIdx) {
    const project = this.data.projects.find(p => p.id === projectId);
    if (project) {
      project.files.splice(fileIdx, 1);
      this.renderProjectDetail();
      this.markUnsaved();
    }
  }

  previewFile(projectId, fileIdx) {
    const project = this.data.projects.find(p => p.id === projectId);
    if (!project || !project.files[fileIdx]) return;
    const file = project.files[fileIdx];
    window.open(file.data, '_blank');
  }

  copyProjectDesc(id) {
    const project = this.data.projects.find(p => p.id === id);
    if (project) {
      const text = `${project.name}\n角色：${project.role}\n时间：${project.startDate} ~ ${project.endDate}\n技术栈：${project.techStack}\n描述：${project.description.replace(/<[^>]*>/g, '')}\n成果：${project.achievements.replace(/<[^>]*>/g, '')}`;
      navigator.clipboard.writeText(text).then(() => {
        this.showToast('项目描述已复制到剪贴板');
      });
    }
  }

  exportSingleProject(id) {
    const project = this.data.projects.find(p => p.id === id);
    if (!project) return;
    
    const element = document.createElement('div');
    element.innerHTML = `
      <h1>${project.name}</h1>
      <p><strong>角色：</strong>${project.role}</p>
      <p><strong>时间：</strong>${project.startDate} ~ ${project.endDate}</p>
      <p><strong>技术栈：</strong>${project.techStack}</p>
      <p><strong>描述：</strong></p>
      <div>${project.description}</div>
      <p><strong>成果：</strong></p>
      <div>${project.achievements}</div>
    `;
    
    html2pdf().set({
      margin: 10,
      filename: `${project.name}.pdf`,
      html2canvas: { scale: 2 },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    }).from(element).save();
  }

  // ========== 校园经历 ==========
  addCampus() {
    this.data.campus.unshift({
      id: Date.now(),
      startDate: '',
      endDate: '',
      position: '',
      organization: '',
      content: '',
      achievements: ''
    });
    this.renderCampus();
    this.markUnsaved();
    this.saveVersion();
  }

  removeCampus(id) {
    this.data.campus = this.data.campus.filter(c => c.id !== id);
    this.renderCampus();
    this.markUnsaved();
    this.saveVersion();
  }

  updateCampus(id, field, value) {
    const item = this.data.campus.find(c => c.id === id);
    if (item) {
      item[field] = value;
      this.markUnsaved();
    }
  }

  renderCampus() {
    const container = document.getElementById('campusList');
    if (!container) return;

    container.innerHTML = this.data.campus.map(item => `
      <div class="card p-5">
        <div class="flex items-start justify-between mb-4">
          <div class="flex items-center gap-3">
            <i class="fas fa-grip-vertical drag-handle text-ink-300 cursor-grab"></i>
            <h3 class="font-semibold text-ink-800">校园经历</h3>
          </div>
          <button onclick="app.removeCampus(${item.id})" class="btn-danger">
            <i class="fas fa-trash-alt"></i> 删除
          </button>
        </div>
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-sm text-ink-500 mb-1">开始时间</label>
            <input type="month" class="input-field" value="${item.startDate}" onchange="app.updateCampus(${item.id}, 'startDate', this.value)">
          </div>
          <div>
            <label class="block text-sm text-ink-500 mb-1">结束时间</label>
            <input type="month" class="input-field" value="${item.endDate}" onchange="app.updateCampus(${item.id}, 'endDate', this.value)">
          </div>
          <div>
            <label class="block text-sm text-ink-500 mb-1">职位</label>
            <input type="text" class="input-field" placeholder="如：学生会主席" value="${item.position}" onchange="app.updateCampus(${item.id}, 'position', this.value)">
          </div>
          <div>
            <label class="block text-sm text-ink-500 mb-1">组织名称</label>
            <input type="text" class="input-field" placeholder="如：学生会" value="${item.organization}" onchange="app.updateCampus(${item.id}, 'organization', this.value)">
          </div>
          <div class="col-span-2">
            <label class="block text-sm text-ink-500 mb-1">工作内容</label>
            <div class="editor-toolbar">
              <button onclick="app.formatText('campus-content-${item.id}', 'bold')"><i class="fas fa-bold"></i></button>
              <button onclick="app.formatText('campus-content-${item.id}', 'italic')"><i class="fas fa-italic"></i></button>
              <button onclick="app.formatText('campus-content-${item.id}', 'insertUnorderedList')"><i class="fas fa-list-ul"></i></button>
            </div>
            <div id="campus-content-${item.id}" class="rich-editor" contenteditable="true" onblur="app.updateCampus(${item.id}, 'content', this.innerHTML)">${item.content}</div>
          </div>
          <div class="col-span-2">
            <label class="block text-sm text-ink-500 mb-1">成果</label>
            <input type="text" class="input-field" placeholder="描述你的成果" value="${item.achievements}" onchange="app.updateCampus(${item.id}, 'achievements', this.value)">
          </div>
        </div>
      </div>
    `).join('');
  }

  // ========== 个人技能 ==========
  addSkillCategory() {
    this.data.skills.push({
      id: Date.now(),
      category: '新分类',
      items: []
    });
    this.renderSkills();
    this.markUnsaved();
    this.saveVersion();
  }

  removeSkillCategory(id) {
    this.data.skills = this.data.skills.filter(s => s.id !== id);
    this.renderSkills();
    this.markUnsaved();
    this.saveVersion();
  }

  addSkill(categoryId) {
    const category = this.data.skills.find(s => s.id === categoryId);
    if (category) {
      category.items.push({
        id: Date.now(),
        name: '',
        level: 3
      });
      this.renderSkills();
      this.markUnsaved();
    }
  }

  removeSkill(categoryId, skillId) {
    const category = this.data.skills.find(s => s.id === categoryId);
    if (category) {
      category.items = category.items.filter(i => i.id !== skillId);
      this.renderSkills();
      this.markUnsaved();
    }
  }

  updateSkillCategory(id, value) {
    const category = this.data.skills.find(s => s.id === id);
    if (category) {
      category.category = value;
      this.markUnsaved();
    }
  }

  updateSkill(categoryId, skillId, field, value) {
    const category = this.data.skills.find(s => s.id === categoryId);
    if (category) {
      const skill = category.items.find(i => i.id === skillId);
      if (skill) {
        skill[field] = value;
        this.markUnsaved();
      }
    }
  }

  renderSkills() {
    const container = document.getElementById('skillsList');
    if (!container) return;

    container.innerHTML = this.data.skills.map(cat => `
      <div class="card p-5">
        <div class="flex items-center justify-between mb-4">
          <input type="text" class="input-field font-semibold text-ink-800" value="${cat.category}" onchange="app.updateSkillCategory(${cat.id}, this.value)">
          <div class="flex items-center gap-2 ml-2">
            <button onclick="app.addSkill(${cat.id})" class="p-2 rounded-lg hover:bg-primary-50 text-primary-600 transition-colors">
              <i class="fas fa-plus text-sm"></i>
            </button>
            <button onclick="app.removeSkillCategory(${cat.id})" class="p-2 rounded-lg hover:bg-red-50 text-red-500 transition-colors">
              <i class="fas fa-trash-alt text-sm"></i>
            </button>
          </div>
        </div>
        <div class="space-y-3">
          ${cat.items.map(skill => `
            <div class="flex items-center gap-3">
              <input type="text" class="input-field text-sm flex-1" placeholder="技能名称" value="${skill.name}" onchange="app.updateSkill(${cat.id}, ${skill.id}, 'name', this.value)">
              <div class="star-rating">
                ${[1,2,3,4,5].map(star => `
                  <i class="fas fa-star ${star <= skill.level ? 'filled' : ''}" onclick="app.updateSkill(${cat.id}, ${skill.id}, 'level', ${star}); app.renderSkills()"></i>
                `).join('')}
              </div>
              <button onclick="app.removeSkill(${cat.id}, ${skill.id})" class="p-1.5 rounded-lg hover:bg-red-50 text-ink-400 hover:text-red-500 transition-colors">
                <i class="fas fa-times text-xs"></i>
              </button>
            </div>
          `).join('')}
        </div>
      </div>
    `).join('');
  }

  // ========== 富文本编辑 ==========
  formatText(elementId, command) {
    const element = document.getElementById(elementId);
    if (element) {
      element.focus();
      document.execCommand(command, false, null);
    }
  }

  // ========== 保存与加载 ==========
  loadData() {
    try {
      const data = localStorage.getItem('resumeData');
      return data ? JSON.parse(data) : null;
    } catch (e) {
      return null;
    }
  }

  saveData() {
    localStorage.setItem('resumeData', JSON.stringify(this.data));
    this.showSaveStatus('已保存');
    this.showToast('保存成功');
    this.saveVersion();
  }

  startAutoSave() {
    setInterval(() => {
      localStorage.setItem('resumeData', JSON.stringify(this.data));
      this.showSaveStatus('已自动保存');
    }, 30000);
  }

  markUnsaved() {
    this.showSaveStatus('未保存');
  }

  showSaveStatus(status) {
    const el = document.getElementById('saveStatus');
    const timeEl = document.getElementById('lastSaveTime');
    if (status === '未保存') {
      el.innerHTML = '<i class="fas fa-circle text-amber-500 mr-1"></i>未保存';
    } else {
      el.innerHTML = '<i class="fas fa-check-circle text-green-500 mr-1"></i>' + status;
    }
    timeEl.textContent = new Date().toLocaleString('zh-CN');
  }

  // ========== 导出功能 ==========
  exportJSON() {
    const dataStr = JSON.stringify(this.data, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `简历数据_${new Date().toISOString().slice(0,10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    this.showToast('JSON导出成功');
  }

  importJSON() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          // 保存当前版本
          this.saveVersion();
          
          this.data = JSON.parse(event.target.result);
          this.renderAll();
          this.saveData();
          this.showToast('导入成功');
        } catch (err) {
          this.showToast('文件格式错误', 'error');
        }
      };
      reader.readAsText(file);
    };
    input.click();
  }

  exportPDF() {
    const element = document.getElementById('previewContent');
    this.generatePreviewContent();
    
    setTimeout(() => {
      html2pdf().set({
        margin: 10,
        filename: `简历_${this.data.basic.name || '未命名'}.pdf`,
        html2canvas: { scale: 2 },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
      }).from(element).save();
    }, 100);
  }

  exportWord() {
    const { Document, Packer, Paragraph, TextRun, HeadingLevel } = docx;
    
    const children = [
      new Paragraph({
        text: this.data.basic.name || '个人简历',
        heading: HeadingLevel.TITLE,
        spacing: { after: 200 }
      }),
      new Paragraph({
        children: [
          new TextRun({ text: '求职意向：', bold: true }),
          new TextRun(this.data.basic.jobTarget || '')
        ],
        spacing: { after: 100 }
      }),
      new Paragraph({
        children: [
          new TextRun({ text: '联系方式：', bold: true }),
          new TextRun(`${this.data.basic.phone || ''} | ${this.data.basic.email || ''}`)
        ],
        spacing: { after: 200 }
      })
    ];

    if (this.data.education.length > 0) {
      children.push(new Paragraph({ text: '教育经历', heading: HeadingLevel.HEADING_1, spacing: { before: 200, after: 100 } }));
      this.data.education.forEach(edu => {
        children.push(new Paragraph({
          children: [
            new TextRun({ text: `${edu.school} | ${edu.major} | ${edu.degree}`, bold: true }),
            new TextRun({ text: `  ${edu.startDate} ~ ${edu.endDate}`, color: '666666' })
          ],
          spacing: { after: 50 }
        }));
      });
    }

    if (this.data.projects.length > 0) {
      children.push(new Paragraph({ text: '项目经历', heading: HeadingLevel.HEADING_1, spacing: { before: 200, after: 100 } }));
      this.data.projects.forEach(proj => {
        children.push(new Paragraph({
          children: [
            new TextRun({ text: proj.name, bold: true }),
            new TextRun({ text: `  ${proj.startDate} ~ ${proj.endDate}`, color: '666666' })
          ],
          spacing: { after: 50 }
        }));
        children.push(new Paragraph({ text: `角色：${proj.role} | 技术栈：${proj.techStack}`, spacing: { after: 50 } }));
        children.push(new Paragraph({ text: proj.description.replace(/<[^>]*>/g, ''), spacing: { after: 100 } }));
      });
    }

    const doc = new Document({ sections: [{ children }] });
    Packer.toBlob(doc).then(blob => {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `简历_${this.data.basic.name || '未命名'}.docx`;
      a.click();
      URL.revokeObjectURL(url);
      this.showToast('Word导出成功');
    });
  }

  // ========== 预览 ==========
  togglePreview() {
    const modal = document.getElementById('previewModal');
    modal.classList.toggle('active');
    if (modal.classList.contains('active')) {
      this.generatePreviewContent();
    }
  }

  generatePreviewContent() {
    const container = document.getElementById('previewContent');
    const b = this.data.basic;
    
    let html = `
      <div class="max-w-3xl mx-auto">
        <div class="text-center mb-8">
          <h1 class="font-serif text-3xl font-bold text-ink-900 mb-2">${b.name || '姓名'}</h1>
          <p class="text-ink-500">${b.jobTarget || '求职意向'}</p>
          <div class="flex justify-center gap-4 mt-3 text-sm text-ink-400">
            ${b.phone ? `<span><i class="fas fa-phone mr-1"></i>${b.phone}</span>` : ''}
            ${b.email ? `<span><i class="fas fa-envelope mr-1"></i>${b.email}</span>` : ''}
            ${b.hometown ? `<span><i class="fas fa-map-marker-alt mr-1"></i>${b.hometown}</span>` : ''}
          </div>
        </div>
    `;

    if (this.data.education.length > 0) {
      html += `
        <div class="mb-6">
          <h2 class="font-serif text-xl font-bold text-ink-800 mb-3 pb-2 border-b-2 border-primary-200">教育经历</h2>
          ${this.data.education.map(edu => `
            <div class="mb-3">
              <div class="flex justify-between items-baseline">
                <span class="font-semibold">${edu.school} · ${edu.major}</span>
                <span class="text-sm text-ink-400">${edu.startDate} ~ ${edu.endDate}</span>
              </div>
              <div class="text-sm text-ink-500">${edu.degree}${edu.gpa ? ` | GPA: ${edu.gpa}` : ''}</div>
            </div>
          `).join('')}
        </div>
      `;
    }

    if (this.data.projects.length > 0) {
      html += `
        <div class="mb-6">
          <h2 class="font-serif text-xl font-bold text-ink-800 mb-3 pb-2 border-b-2 border-primary-200">项目经历</h2>
          ${this.data.projects.map(proj => `
            <div class="mb-4">
              <div class="flex justify-between items-baseline">
                <span class="font-semibold">${proj.name}</span>
                <span class="text-sm text-ink-400">${proj.startDate} ~ ${proj.endDate}</span>
              </div>
              <div class="text-sm text-ink-500 mb-1">${proj.role} | ${proj.techStack}</div>
              <div class="text-sm text-ink-600">${proj.description}</div>
            </div>
          `).join('')}
        </div>
      `;
    }

    if (this.data.campus.length > 0) {
      html += `
        <div class="mb-6">
          <h2 class="font-serif text-xl font-bold text-ink-800 mb-3 pb-2 border-b-2 border-primary-200">校园经历</h2>
          ${this.data.campus.map(c => `
            <div class="mb-3">
              <div class="flex justify-between items-baseline">
                <span class="font-semibold">${c.organization} · ${c.position}</span>
                <span class="text-sm text-ink-400">${c.startDate} ~ ${c.endDate}</span>
              </div>
              <div class="text-sm text-ink-600">${c.content}</div>
            </div>
          `).join('')}
        </div>
      `;
    }

    if (this.data.skills.length > 0) {
      html += `
        <div class="mb-6">
          <h2 class="font-serif text-xl font-bold text-ink-800 mb-3 pb-2 border-b-2 border-primary-200">个人技能</h2>
          <div class="grid grid-cols-2 gap-4">
            ${this.data.skills.map(cat => `
              <div>
                <div class="font-medium text-sm mb-2">${cat.category}</div>
                <div class="flex flex-wrap gap-2">
                  ${cat.items.map(skill => `
                    <span class="px-2 py-1 bg-ink-100 rounded text-xs">${skill.name} ${'★'.repeat(skill.level)}${'☆'.repeat(5-skill.level)}</span>
                  `).join('')}
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      `;
    }

    html += '</div>';
    container.innerHTML = html;
  }

  // ========== 工具方法 ==========
  renderAll() {
    // 基本信息
    Object.keys(this.data.basic).forEach(key => {
      const input = document.querySelector(`[data-field="${key}"]`);
      if (input && key !== 'avatar') {
        input.value = this.data.basic[key] || '';
      }
    });
    this.renderAvatar();
    this.renderEducation();
    this.renderProjects();
    this.renderCampus();
    this.renderSkills();
  }

  showToast(message, type = 'success') {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.style.background = type === 'error' ? '#dc2626' : '#1e293b';
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 3000);
  }

  toggleTheme() {
    document.body.classList.toggle('dark');
    this.showToast('主题切换功能开发中');
  }
}

// 初始化应用
let app;
document.addEventListener('DOMContentLoaded', () => {
  app = new ResumeApp();
});
