#pragma once

#include "vk_utility_vulkan_include.h"

namespace vk_utility
{
    namespace core
    {
        class DescriptorPoolFactory
        {
        public:

            virtual vk::DescriptorPool New(vk::Device device) const = 0;
        };
    }
}