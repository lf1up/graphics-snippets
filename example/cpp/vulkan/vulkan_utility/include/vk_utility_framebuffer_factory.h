#pragma once

#include "vk_utility_vulkan_include.h"

namespace vk_utility
{
    namespace buffer
    {
        class FramebufferFactory
        {
        public:

            virtual vk::Framebuffer New(vk::Device device) const = 0;
        };
    }
}