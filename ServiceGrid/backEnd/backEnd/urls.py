"""backEnd URL Configuration

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/2.2/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.urls import path
from . import view
from django.conf.urls import url

urlpatterns = [
    url(r'^$', view.hello),
    path('backEnd/queryServices', view.queryServices),
    path('backEnd/queryService', view.queryService),
    path('backEnd/manageService',view.manageService),
    path('backEnd/deleteService',view.deleteService),
    path('backEnd/invokeService',view.invokeService), #调用服务接口
    path('backEnd/queryTask',view.queryTask), #调用服务接口
    path('backEnd/queryTasks',view.queryTasks), #调用服务接口
    path('backEnd/dongcang/insertInfo',view.insertInfo), 
    path('backEnd/dongcang/queryInfos',view.queryInfos), 
]
